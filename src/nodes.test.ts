import {
    AdditionNode,
    DivisionNode,
    MultiplicationNode,
    SubtractionNode,
    ValueNode,
    PowerNode,
    VariableNode,
} from "./nodes";

// TODO: migrate simple computations to just numbers
describe("Forward computations", () => {
    test("store singular value", () => {
        let x = new ValueNode(3);

        expect(x.compute()).toBe(3);
    });

    test("add two numbers", () => {
        let c = new AdditionNode(5, 3);

        expect(c.compute()).toBe(8);
    });

    test("add multiple numbers", () => {
        let d = new AdditionNode(-1.2, 3, 9);

        expect(d.compute()).toBeCloseTo(10.8);
    });

    test("multiply two numbers", () => {
        let c = new MultiplicationNode(5, 3);

        expect(c.compute()).toBe(15);
    });

    test("multiply multiple numbers", () => {
        let d = new MultiplicationNode(-0.5, 3, 9);

        expect(d.compute()).toBeCloseTo(-13.5);
    });

    test("subtract two numbers", () => {
        let d = new SubtractionNode(5, 1);

        expect(d.compute()).toBe(4);
    });

    test("divide two numbers", () => {
        let d = new DivisionNode(5, 2);

        expect(d.compute()).toBeCloseTo(2.5);
    });

    test("divide by zero", () => {
        let d = new DivisionNode(5, 0);

        expect(() => d.compute()).toThrow();
    });

    test("multistaged computation", () => {
        // 5 - 3 * (7 + 4)
        let e = new AdditionNode(7, 4);
        let f = new MultiplicationNode(3, e);
        let g = new SubtractionNode(5, f);

        expect(g.compute()).toBe(-28);
    });
});

describe("Advanced forward computations", () => {
    test("compute basic powers", () => {
        let a = new PowerNode(2, 5);
        let b = new PowerNode(3, 0);

        expect(a.compute()).toBe(Math.pow(2, 5));
        expect(b.compute()).toBe(1);
    });

    test("exponentiation", () => {
        let a = new PowerNode(Math.E, 2);

        expect(a.compute()).toBeCloseTo(Math.exp(2));
    });
});

describe("Gradient calculation", () => {
    let a = new VariableNode("a");
    let b = new VariableNode("b");

    let add = new AdditionNode(a, b);
    let mul = new MultiplicationNode(a, b);
    let sub = new SubtractionNode(a, b);
    let div = new DivisionNode(a, b);

    test("basic value", () => {
        expect(a.gradient(a)).toBe(1);
        expect(a.gradient(b)).toBe(0);
    });

    test("basic addition", () => {
        add.compute({
            a: 8,
            b: 3,
        });
        expect(add.gradient(a)).toBe(1);
        expect(add.gradient(b)).toBe(1);
    });

    test("basic subtraction", () => {
        sub.compute({
            a: 8,
            b: 3,
        });
        expect(sub.gradient(a)).toBe(1);
        expect(sub.gradient(b)).toBe(-1);
    });

    test("basic multiplication", () => {
        mul.compute({
            a: 8,
            b: 3,
        });
        expect(mul.gradient(a)).toBe(b.value);
        expect(mul.gradient(b)).toBe(a.value);
    });

    test("basic division", () => {
        div.compute({
            a: 8,
            b: 3,
        });
        expect(div.gradient(a)).toBeCloseTo(1 / b.value);
        expect(div.gradient(b)).toBeCloseTo(-a.value / b.value ** 2);
    });

    test("multistaged gradient", () => {
        // a = 8, b = 3

        // a * 3 - (2 / a)
        let c = new VariableNode("c");

        let ba = new MultiplicationNode(a, b);
        let coa = new DivisionNode(c, a);

        let final = new SubtractionNode(ba, coa);

        expect(final.compute({ a: 8, b: 3, c: 2 })).toBeCloseTo(8 * 3 - 2 / 8);
        expect(final.gradient(a)).toBeCloseTo(2 / 8 ** 2 + 3); // from wolfram
        expect(final.gradient(b)).toBeCloseTo(8);
        expect(final.gradient(c)).toBeCloseTo(-1 / 8);
        expect(ba.gradient(final)).toBe(0); // final doesn't change any of its variables
    });
});

describe("Advanced gradients", () => {
    test("Basic power gradients", () => {
        let x = new VariableNode("x");
        let y = new VariableNode("y");

        let p = new PowerNode(x, y);
        p.compute({
            x: 3,
            y: 2.3,
        });

        // checked on wolframalpha
        expect(p.gradient(x)).toBeCloseTo(9.59369);
        expect(p.gradient(y)).toBeCloseTo(13.7475);
    });
    test("exponentiation gradient", () => {
        let x = new VariableNode("x");
        let exp = new PowerNode(Math.E, x);

        exp.compute({ x: 5 });
        expect(exp.gradient(x)).toBeCloseTo(exp.value); // e^x => e^x
    });
});

describe("Variable usage", () => {
    let a = new VariableNode("a");
    let b = new VariableNode("b");

    test("define variable with session", () => {
        expect(a.compute({ a: 5 })).toBe(5);
    });

    test("undefined variable", () => {
        expect(() => a.compute()).toThrow();
        expect(() => a.compute({ foo: 2 })).toThrow();
    });

    test("variable in computation", () => {
        let sub = new SubtractionNode(5, a); // 5 - a
        expect(a.compute({ a: 2 })).toBe(2);
        expect(sub.compute({ a: 2 })).toBe(3); // 5 - 2
    });

    test("multiple variables", () => {
        // a * b - 5 / a
        let comp = new SubtractionNode(
            new MultiplicationNode(a, b),
            new DivisionNode(5, a)
        );

        expect(comp.compute({ a: 2, b: 7 })).toBeCloseTo(2 * 7 - 5 / 2);
        expect(comp.compute({ a: 5, b: 0 })).toBeCloseTo(-1);
        expect(() => comp.compute({ a: 3 })).toThrow();
        expect(() => comp.compute({ a: 0, b: 5 })).toThrow();
    });
});
