export enum TokenType {
    LPAR,
    RPAR,
    ADD,
    SUB,
    MUL,
    DIV,
    POW,
    VAR,
    NUM,
}

export class Token {
    type: TokenType;
    literal: string;
    constructor(type: TokenType, literal: string) {
        this.type = type;
        this.literal = literal;
    }
}

export class Lexer {
    pos: number;
    input: string;
    error: string;

    constructor(input: string) {
        this.pos = 0;
        this.error = "";
        this.input = input.replace(/\s+/g, "");
    }

    public lex(): Array<Token> {
        const tokens: Array<Token> = [];

        while (this.pos < this.input.length && !this.error) {
            const ch = this.input[this.pos];

            if (ch >= "0" && ch <= "9") {
                let dec = false;
                let numStr = "";
                let end = this.pos;

                while (
                    (this.input[end] >= "0" && this.input[end] <= "9") ||
                    this.input[end] == "."
                ) {
                    if (this.input[end] == ".") {
                        if (dec) {
                            this.error = `Unexpected '.' at ${end}`;
                            return tokens;
                        }
                        dec = true;
                    }
                    numStr += this.input[end];
                    end++;
                }

                this.pos = end - 1;
                tokens.push(new Token(TokenType.NUM, numStr));
            } else if (ch >= "a" && ch <= "z") {
                tokens.push(new Token(TokenType.VAR, ch));
            } else {
                let type: TokenType;
                switch (ch) {
                    case "+":
                        type = TokenType.ADD;
                        break;
                    case "-":
                        type = TokenType.SUB;
                        break;
                    case "/":
                        type = TokenType.DIV;
                        break;
                    case "*":
                        type = TokenType.MUL;
                        break;
                    case "^":
                        type = TokenType.POW;
                        break;
                    case "(":
                        type = TokenType.LPAR;
                        break;
                    case ")":
                        type = TokenType.RPAR;
                        break;
                    default:
                        this.error = `Unexpected character ${ch} at ${this.pos}`;
                        return tokens;
                }
                tokens.push(new Token(type, ch));
            }

            this.pos++;
        }

        return tokens;
    }
}
