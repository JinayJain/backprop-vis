import cytoscape, { ElementDefinition } from "cytoscape";
import katex from "katex";
import { Lexer } from "./lexer";
import {
    AdditionNode,
    ComputationNode,
    DivisionNode,
    MultiplicationNode,
    OutputNode,
    PowerNode,
    Session,
    SubtractionNode,
    ValueNode,
    VariableNode,
} from "./nodes";
import * as ops from "./ops";
import Parser from "./parser";

const dagre = require("cytoscape-dagre");
cytoscape.use(dagre);

function getLabel(node: ComputationNode) {
    if (node instanceof AdditionNode) {
        return "+";
    } else if (node instanceof SubtractionNode) {
        return "-";
    } else if (node instanceof MultiplicationNode) {
        return "*";
    } else if (node instanceof DivisionNode) {
        return "/";
    } else if (node instanceof PowerNode) {
        return "^";
    } else if (node instanceof ValueNode) {
        return node.value.toFixed(3);
    } else if (node instanceof VariableNode) {
        return node.name;
    } else if (node instanceof OutputNode) {
        return "out";
    } else {
        return "node " + node.id;
    }
}

function generateGraph(root: ComputationNode): ElementDefinition[] {
    let graph: ElementDefinition[] = [];

    let visited = new Set<string>();
    let nodeQueue: ComputationNode[] = [root];

    while (nodeQueue.length > 0) {
        let curr = nodeQueue.shift()!;

        if (visited.has(curr.id)) {
            continue;
        }

        visited.add(curr.id);
        graph.push({
            data: {
                id: curr.id,
                label: getLabel(curr),
            },
        });

        curr.inputs.forEach((input) => {
            graph.push({
                data: {
                    target: input.id,
                    source: curr.id,
                    value: "",
                    grad: "",
                },
            });
            nodeQueue.push(input);
        });
    }

    return graph;
}

function renderKatex(value: string) {
    katex.render(value, equation);
}

function renderVariables(varList: Array<VariableNode>) {
    let variablesElement: HTMLElement = document.getElementById("variables")!;
    variablesElement.innerHTML = varList
        .map((varNode) => {
            return `<li>
                    <label for="${varNode.name}" class="var-label">${varNode.name}</label>
                    <input value="0" type="number" step="any" id="${varNode.name}-input"></input>
                </li>`;
        })
        .join("\n");
}

const equation: HTMLElement = document.getElementById("latex-equation")!;
let variableList: VariableNode[] = [ops.variable("x")];
let comp = ops.div(
    1,
    ops.add(1, ops.pow(Math.E, ops.mul(-1, variableList[0])))
);

renderKatex(comp.toLatex());
renderVariables(variableList);

var cy = cytoscape({
    container: document.getElementById("cy"),
    elements: generateGraph(comp),
    minZoom: 0.5,
    maxZoom: 2,
    wheelSensitivity: 0.5,
    layout: {
        name: "breadthfirst",
        directed: true,
        roots: "#" + comp.id,
    },
    style: [
        {
            selector: "node",
            style: {
                "padding-bottom": "20px",
                label: "data(label)",
                "font-family": "Libre Caslon Text",
                // @ts-ignore
                "text-halign": "center",
                // @ts-ignore
                "text-valign": "center",
                color: "#EFF2F1",
                backgroundColor: "#4059AD",
                "font-size": "24px",
                width: "label",
                height: "label",
            },
        },
        {
            selector: "edge",
            style: {
                "font-family": "Libre Caslon Text",
                "source-text-offset": 40,
                "target-text-offset": 40,
                "source-label": "data(value)",
                "target-label": "data(grad)",
                // @ts-ignore
                // "source-text-rotation": "autorotate",
                "font-size": 25,
                color: "#222222",
                width: 3,
                // @ts-ignore
                "curve-style": "bezier",
                "control-point-step-size": 150,
                "line-color": "#667ABD",
                // @ts-ignore
                "source-arrow-shape": "triangle",
                "source-arrow-color": "#4BB3FD",
                "arrow-scale": 2,
            },
        },
    ],
});

let timeout = 0;
let equationInput = <HTMLInputElement>document.getElementById("equation");
equationInput.addEventListener("keyup", (ev) => {
    clearTimeout(timeout);

    timeout = <any>window.setTimeout(() => {
        const eq = (<HTMLInputElement>ev.target).value;
        const l = new Lexer(eq);
        const p = new Parser(l.lex());
        console.log(p.error, l.error);

        if (l.error || p.error) {
            renderKatex("error");
            return;
        }
        comp = p.parse();
        variableList = p.variables;
        renderVariables(p.variables);
        renderKatex(comp.toLatex());
        cy.batch(() => {
            cy.elements().remove();
            cy.add(generateGraph(comp));
        });
        cy.layout({
            name: "breadthfirst",
            directed: true,
            roots: "#" + comp.id,
        }).run();
    }, 1000);
});

const computeButton = document.getElementById("compute") as HTMLButtonElement;

computeButton.addEventListener("click", () => {
    let session: Session = {};

    variableList.forEach((varNode) => {
        const varInput = <HTMLInputElement>(
            document.getElementById(varNode.name + "-input")
        );

        session[varNode.name] = parseFloat(varInput.value);
    });

    let values = new Map<string, number>();

    function compute(node: ComputationNode): number {
        node.inputs.forEach((child, idx) => {
            compute(child);
            node.buffer[idx] = values.get(child.id)!;
        });

        let value = node.computeNode(session);
        values.set(node.id, value);
        return value;
    }

    let finalValue = compute(comp);

    katex.render(comp.toLatex() + " = " + finalValue.toFixed(5), equation);

    values.forEach((value, id) => {
        cy.elements(`edge[target = "${id}"]`).data("value", value.toFixed(3));
    });
});

const gradientButton = document.getElementById("gradient") as HTMLButtonElement;

gradientButton.addEventListener("click", () => {
    let session: Session = {};

    variableList.forEach((varNode) => {
        const varInput = <HTMLInputElement>(
            document.getElementById(varNode.name + "-input")
        );

        session[varNode.name] = parseFloat(varInput.value);
    });
    let grads = new Map<string, number>();
    let value = comp.compute(session);

    function findGradient(node: ComputationNode, propGradient: number) {
        grads.set(node.id, propGradient);

        for (let i = 0; i < node.inputs.length; i++) {
            const child = node.inputs[i];
            findGradient(child, propGradient * node.localGradient(i));
        }
    }

    comp.compute(session);
    findGradient(comp, 1);

    grads.forEach((grad, id) => {
        cy.elements(`edge[target = "${id}"]`).data("grad", grad.toFixed(3));
    });
});
