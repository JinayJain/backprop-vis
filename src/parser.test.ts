import Parser from "./parser";
import { Token, Lexer } from "./lexer";

describe("Parser tests", () => {
    test("Create parser", () => {
        const parser = new Parser([]);
        expect(parser).toBeDefined();
    });

    test("Individual operations", () => {
        const tests = ["3.0+5", "2-5.2384", "7*5.2", "1/4", "2^3", "-3.349"];
        const expected = [8, 2 - 5.2384, 7 * 5.2, 0.25, 8, -3.349];

        tests.forEach((t, i) => {
            const lex = new Lexer(t);
            const parser = new Parser(lex.lex());

            expect(parser.parse().compute()).toBeCloseTo(expected[i]);
        });
    });

    test("Variables", () => {
        const tests = ["3*x", "20-y", "a/b", "r^x"];
        const sessions: any = [
            {
                x: 3,
            },
            {
                y: 0.25,
            },
            {
                a: 2,
                b: 10,
            },
            {
                r: 3,
                x: 2,
            },
        ];
        const expected = [9, 20 - 0.25, 2 / 10, 9];
        tests.forEach((t, i) => {
            const lex = new Lexer(t);
            const parser = new Parser(lex.lex());
            expect(parser.parse().compute(sessions[i])).toBeCloseTo(
                expected[i]
            );
        });
    });

    test("Order of operations", () => {
        const tests = [
            "3.0+5*0.45",
            "2/8-5.2384",
            "(5+3)*5.2",
            "(43/3)/4",
            "(2+1)^3",
            "---3.349",
        ];
        const expected = [
            3 + 5 * 0.45,
            0.25 - 5.2384,
            (5 + 3) * 5.2,
            43 / 12,
            27,
            -3.349,
        ];

        tests.forEach((t, i) => {
            const lex = new Lexer(t);
            const parser = new Parser(lex.lex());

            expect(parser.parse().compute()).toBeCloseTo(expected[i]);
        });
    });

    test("Negative values", () => {
        const tests = ["-1", "--5", "(-5 + 3)"];
        const expected = [-1, 5, -2];
        tests.forEach((t, i) => {
            const l = new Lexer(t);
            const p = new Parser(l.lex());
            const result = p.parse();
            expect(result.compute()).toBeCloseTo(expected[i]);
        });
    });
});
