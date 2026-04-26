/**
 * Désérialiseur PHP minimal et robuste pour les payloads sérialisés WooCommerce.
 *
 * Gère:
 *   - s:N:"..."      strings (avec longueur en BYTES, pas en chars — on lit donc en UTF-8 bytes)
 *   - i:N            integers
 *   - d:F            doubles
 *   - b:0|b:1        booleans
 *   - N              null
 *   - a:N:{...}      arrays (objet ou tableau selon clés)
 *   - O:N:"...":N:{} objects (mappés en plain object, métadonnées de classe ignorées)
 *
 * Les valeurs s:N:"..." utilisent N comme nombre d'OCTETS, pas de caractères.
 * Le dump WordPress contient de l'UTF-8 où "é" = 2 octets — c'est essentiel.
 */

export type PhpValue = string | number | boolean | null | PhpValue[] | { [k: string]: PhpValue };

class Reader {
  private buf: Buffer;
  private pos = 0;

  constructor(input: string) {
    // ATTENTION: la string a déjà été décodée depuis JSON. Pour respecter
    // les longueurs en octets de PHP, on travaille sur le buffer UTF-8.
    this.buf = Buffer.from(input, "utf-8");
  }

  peek(): string {
    return String.fromCharCode(this.buf[this.pos]);
  }

  read(n: number): Buffer {
    const out = this.buf.subarray(this.pos, this.pos + n);
    this.pos += n;
    return out;
  }

  expect(ch: string): void {
    const got = String.fromCharCode(this.buf[this.pos]);
    if (got !== ch) {
      throw new Error(`Expected '${ch}' at byte ${this.pos}, got '${got}'`);
    }
    this.pos += 1;
  }

  readUntil(ch: string): string {
    const start = this.pos;
    while (this.pos < this.buf.length && String.fromCharCode(this.buf[this.pos]) !== ch) {
      this.pos += 1;
    }
    return this.buf.subarray(start, this.pos).toString("utf-8");
  }

  readInt(): number {
    const s = this.readUntil(":");
    return parseInt(s, 10);
  }

  readBytes(n: number): string {
    return this.read(n).toString("utf-8");
  }

  done(): boolean {
    return this.pos >= this.buf.length;
  }
}

function parseValue(r: Reader): PhpValue {
  const ch = r.peek();
  switch (ch) {
    case "N": {
      r.expect("N");
      r.expect(";");
      return null;
    }
    case "b": {
      r.expect("b");
      r.expect(":");
      const v = r.readUntil(";");
      r.expect(";");
      return v === "1";
    }
    case "i": {
      r.expect("i");
      r.expect(":");
      const v = r.readUntil(";");
      r.expect(";");
      return parseInt(v, 10);
    }
    case "d": {
      r.expect("d");
      r.expect(":");
      const v = r.readUntil(";");
      r.expect(";");
      return parseFloat(v);
    }
    case "s": {
      r.expect("s");
      r.expect(":");
      const len = r.readInt();
      r.expect(":");
      r.expect('"');
      const str = r.readBytes(len);
      r.expect('"');
      r.expect(";");
      return str;
    }
    case "a": {
      r.expect("a");
      r.expect(":");
      const n = r.readInt();
      r.expect(":");
      r.expect("{");
      const out: Record<string, PhpValue> = {};
      const arr: PhpValue[] = [];
      let allInt = true;
      let expectedIdx = 0;
      for (let i = 0; i < n; i++) {
        const k = parseValue(r) as string | number;
        const v = parseValue(r);
        if (typeof k === "number" && k === expectedIdx) {
          arr.push(v);
          expectedIdx++;
        } else {
          allInt = false;
        }
        out[String(k)] = v;
      }
      r.expect("}");
      return allInt ? arr : out;
    }
    case "O": {
      // O:<class_name_len>:"<class_name>":<num_props>:{...}
      r.expect("O");
      r.expect(":");
      const clsLen = r.readInt();
      r.expect(":");
      r.expect('"');
      r.readBytes(clsLen); // class name — ignoré
      r.expect('"');
      r.expect(":");
      const n = r.readInt();
      r.expect(":");
      r.expect("{");
      const out: Record<string, PhpValue> = {};
      for (let i = 0; i < n; i++) {
        const k = parseValue(r) as string;
        const v = parseValue(r);
        out[String(k)] = v;
      }
      r.expect("}");
      return out;
    }
    default:
      throw new Error(`Unknown PHP serialize token '${ch}' at byte ${(r as any).pos}`);
  }
}

export function phpUnserialize(input: string | null | undefined): PhpValue {
  if (input === null || input === undefined || input === "") return null;
  try {
    const r = new Reader(input);
    return parseValue(r);
  } catch (e) {
    // En cas d'échec on retourne null + log côté caller via try/catch.
    throw e;
  }
}

/** Tente la désérialisation, retourne `fallback` en cas d'erreur. */
export function tryPhpUnserialize<T = PhpValue>(input: string | null | undefined, fallback: T): T | PhpValue {
  if (input === null || input === undefined || input === "") return fallback;
  try {
    return phpUnserialize(input) as PhpValue;
  } catch {
    return fallback;
  }
}
