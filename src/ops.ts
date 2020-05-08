import {
    AdditionNode,
    ComputationNode,
    DivisionNode,
    MultiplicationNode,
    SubtractionNode,
    VariableNode,
    PowerNode,
} from "./nodes";

export function variable(name: string) {
    return new VariableNode(name);
}

export function add(...inputs: (ComputationNode | number)[]) {
    return new AdditionNode(...inputs);
}

export function sub(a: ComputationNode | number, b: ComputationNode | number) {
    return new SubtractionNode(a, b);
}

export function mul(...inputs: (ComputationNode | number)[]) {
    return new MultiplicationNode(...inputs);
}

export function div(a: ComputationNode | number, b: ComputationNode | number) {
    return new DivisionNode(a, b);
}

export function pow(
    base: ComputationNode | number,
    exp: ComputationNode | number
) {
    return new PowerNode(base, exp);
}
