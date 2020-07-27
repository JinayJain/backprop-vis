import shortid from "shortid";

export interface Session {
    [variable: string]: number;
}

export abstract class ComputationNode {
    inputs: ComputationNode[];
    buffer: number[];
    value: number = 0;
    id: string;

    protected constructor(...inputs: (ComputationNode | number)[]) {
        let cleanedInputs: ComputationNode[] = [];
        inputs.forEach((value) => {
            if (typeof value == "number") {
                cleanedInputs.push(new ValueNode(value));
            } else cleanedInputs.push(value);
        });

        this.inputs = cleanedInputs;
        this.buffer = new Array<number>(inputs.length);
        this.id = shortid.generate();
    }

    computeInputs(sess?: Session) {
        for (let i = 0; i < this.inputs.length; i++) {
            this.buffer[i] = this.inputs[i].compute(sess);
        }
    }

    compute(sess?: Session): number {
        this.computeInputs(sess);
        this.value = this.computeNode(sess);
        return this.value;
    }

    abstract computeNode(sess?: Session): number;

    // wrt: with respect to
    gradient(wrt: ComputationNode): number {
        if (wrt == this) {
            return 1; // dx/dx = 1
        }

        let total: number = 0;
        for (let i = 0; i < this.inputs.length; i++) {
            if (this.inputs[i] instanceof ValueNode) continue;
            total += this.localGradient(i) * this.inputs[i].gradient(wrt);
        }

        return total;
    }

    abstract localGradient(idx: number): number;

    abstract toLatex(): string;
}

export class ValueNode extends ComputationNode {
    constructor(value: number) {
        // value nodes have no inputs.
        super();
        this.value = value;
    }

    computeNode(sess?: Session) {
        return this.value;
    }

    gradient(wrt: ComputationNode) {
        if (wrt == this) return 1;
        return 0;
    }

    // this should never be called (no inputs)
    localGradient(idx: number) {
        return 0;
    }

    toLatex() {
        return this.value.toString();
    }
}

export class VariableNode extends ComputationNode {
    name: string;

    constructor(name: string) {
        super();
        this.name = name;
    }

    computeNode(sess?: Session) {
        if (sess === undefined) {
            throw new Error(`Session undefined on variable "${this.name}"`);
        } else if (sess[this.name] === undefined) {
            throw new Error(`Unknown value for variable "${this.name}"`);
        }

        this.value = sess[this.name];
        return this.value;
    }

    localGradient(idx: number) {
        return 0;
    }

    toLatex() {
        return this.name;
    }
}

export class AdditionNode extends ComputationNode {
    constructor(...inputs: (ComputationNode | number)[]) {
        super(...inputs);
    }

    computeNode(sess?: Session) {
        let sum: number = 0;

        for (let i = 0; i < this.buffer.length; i++) {
            sum += this.buffer[i];
        }

        return sum;
    }

    localGradient(idx: number) {
        return 1;
    }

    toLatex() {
        let result = "";

        for (let i = 0; i < this.inputs.length; i++) {
            if (i === this.inputs.length - 1) {
                result += this.inputs[i].toLatex();
                continue;
            }

            result += this.inputs[i].toLatex() + "+";
        }

        return result;
    }
}

export class MultiplicationNode extends ComputationNode {
    constructor(...inputs: (ComputationNode | number)[]) {
        super(...inputs);
    }

    computeNode(sess?: Session) {
        let product: number = 1;

        for (let i = 0; i < this.buffer.length; i++) {
            product *= this.buffer[i];
        }

        return product;
    }

    localGradient(idx: number) {
        let prod = 1;
        this.inputs.forEach((node, i) => {
            if (i != idx) {
                prod *= node.value;
            }
        });
        return prod;
    }

    toLatex() {
        let result = "";

        for (let i = 0; i < this.inputs.length; i++) {
            if (i === this.inputs.length - 1) {
                result += this.inputs[i].toLatex();
                continue;
            }

            result += this.inputs[i].toLatex() + "\\cdot ";
        }

        return result;
    }
}

export class SubtractionNode extends ComputationNode {
    constructor(
        first: ComputationNode | number,
        second: ComputationNode | number
    ) {
        super(first, second);
    }

    computeNode(sess?: Session) {
        return this.buffer[0] - this.buffer[1];
    }

    localGradient(idx: number) {
        return idx == 0 ? 1 : -1;
    }

    toLatex() {
        return this.inputs[0].toLatex() + "-" + this.inputs[1].toLatex();
    }
}

export class DivisionNode extends ComputationNode {
    constructor(
        first: ComputationNode | number,
        second: ComputationNode | number
    ) {
        super(first, second);
    }

    computeNode(sess?: Session) {
        if (this.buffer[1] === 0) throw new Error("Divide by zero");

        return this.buffer[0] / this.buffer[1];
    }

    localGradient(idx: number) {
        if (idx == 0) {
            return 1 / this.inputs[1].value; // 1 / b
        } else {
            return -this.inputs[0].value / this.inputs[1].value ** 2; // -a / b^2
        }
    }

    toLatex() {
        return `\\frac{${this.inputs[0].toLatex()}}{${this.inputs[1].toLatex()}}`;
    }
}

export class PowerNode extends ComputationNode {
    constructor(
        base: ComputationNode | number,
        exponent: ComputationNode | number
    ) {
        super(base, exponent);
    }

    computeNode(sess?: Session) {
        // TODO: Observe behavior on 0^0

        return Math.pow(this.buffer[0], this.buffer[1]);
    }

    localGradient(idx: number) {
        if (idx == 0) {
            // base
            // x^n => n * x ^ (n - 1)
            return (
                this.buffer[1] * Math.pow(this.buffer[0], this.buffer[1] - 1)
            );
        } else {
            // exponent
            // a^x => ln(a) * a^x

            if (this.buffer[0] <= 0)
                throw new Error(
                    "Cannot calculate power gradient: negative base"
                );

            return (
                Math.log(this.buffer[0]) *
                Math.pow(this.buffer[0], this.buffer[1])
            );
        }
    }

    toLatex() {
        return `{(${this.inputs[0].toLatex()})}^{${this.inputs[1].toLatex()}}`;
    }
}

export class OutputNode extends ComputationNode {
    constructor(input: ComputationNode) {
        super(input);
    }

    computeNode(sess: Session) {
        return this.buffer[0];
    }

    localGradient(idx: number) {
        return 1;
    }

    toLatex() {
        return this.inputs[0].toLatex();
    }
}
