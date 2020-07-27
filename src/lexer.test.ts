import { Lexer, Token, TokenType } from "./lexer";

describe("Lexer tests", () => {
    test("Create a Lexer", () => {
        const lex = new Lexer("");
        expect(lex).toBeDefined();
    });
    test("Parse empty string", () => {
        const lex = new Lexer("");
        expect(lex.lex()).toEqual([]);
    });
    test("Parse numbers", () => {
        const numStrings = ["1", "0", "1", "22.5", "5.29"];
        numStrings.forEach((numStr, i) => {
            const lex = new Lexer(numStr);
            let parsed = lex.lex();
            expect(parsed.length).toBe(1);
            expect(parsed[0].type).toBe(TokenType.NUM);
            expect(parsed[0].literal).toBe(numStr);
        });
    });
    test("Parse variables", () => {
        const varStrings = ["x", "y", "m"];
        varStrings.forEach((varStr) => {
            const lex = new Lexer(varStr);
            let parsed = lex.lex();
            expect(parsed.length).toBe(1);
            expect(parsed[0].type).toBe(TokenType.VAR);
            expect(parsed[0].literal).toBe(varStr);
        });
    });
    test("Parse various symbols", () => {
        const tests = ["(())", "-+^/*"];
        const expected = [
            [TokenType.LPAR, TokenType.LPAR, TokenType.RPAR, TokenType.RPAR],
            [
                TokenType.SUB,
                TokenType.ADD,
                TokenType.POW,
                TokenType.DIV,
                TokenType.MUL,
            ],
        ];

        tests.forEach((input, i) => {
            const lex = new Lexer(input);
            const parsed = lex.lex();
            expect(parsed.length).toBe(expected[i].length);
            parsed.forEach((token, j) => {
                expect(token.type).toBe(expected[i][j]);
                expect(token.literal).toBe(tests[i][j]);
            });
        });
    });

    test("Unknown symbols", () => {
        const lex = new Lexer("3+5.23][");
        lex.lex();
        expect(lex.error).not.toEqual("");
    });

    test("Invalid number", () => {
        const lex = new Lexer("5.2323.25");
        lex.lex();
        expect(lex.error).not.toEqual("");
    });

    test("Parse with whitespace", () => {
        const tests = ["( 3 + 5 )", "2.3465/9"];
        const lengths = [5, 3];
        tests.forEach((t, i) => {
            const lex = new Lexer(t);
            expect(lex.lex().length).toBe(lengths[i]);
        });
    });
});
