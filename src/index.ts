import * as ops from "./ops";
import cytoscape, { ElementDefinition } from "cytoscape";
import katex from "katex";
import {
    Session,
    ComputationNode,
    AdditionNode,
    SubtractionNode,
    MultiplicationNode,
    DivisionNode,
    PowerNode,
    ValueNode,
    VariableNode,
    OutputNode,
} from "./nodes";

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

let variableList: VariableNode[] = [ops.variable("x")];
let comp = ops.div(
    1,
    ops.add(1, ops.pow(Math.E, ops.mul(-1, variableList[0])))
);

const equation: HTMLElement = document.getElementById("equation")!;

katex.render(comp.toLatex(), equation);

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
                color: "#ffffff",
                backgroundColor: "#094d92",
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
                "text-background-color": "#ff00ff",
                "font-size": 25,
                color: "#ffffff",
                width: 3,
                // @ts-ignore
                "curve-style": "bezier",
                "control-point-step-size": 150,
                "line-color": "#3E6680",
                // @ts-ignore
                "source-arrow-shape": "triangle",
                "source-arrow-color": "#4BB3FD",
                "arrow-scale": 2,
            },
        },
    ],
});

let variablesElement: HTMLElement = document.getElementById("variables")!;
variablesElement.innerHTML = variableList
    .map((varNode) => {
        return `<li>
                    <label for="${varNode.name}">${varNode.name}</label>
                    <input value="0" type="number" step="any" id="${varNode.name}-input"></input>
                </li>`;
    })
    .join("\n");

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
    let grads = new Map<string, number>();

    function findGradient(node: ComputationNode, propGradient: number) {
        grads.set(node.id, propGradient);

        for (let i = 0; i < node.inputs.length; i++) {
            const child = node.inputs[i];
            findGradient(child, propGradient * node.localGradient(i));
        }
    }

    let session: Session = {};

    variableList.forEach((varNode) => {
        const varInput = <HTMLInputElement>(
            document.getElementById(varNode.name + "-input")
        );

        session[varNode.name] = parseFloat(varInput.value);
    });

    comp.compute(session);
    findGradient(comp, 1);

    grads.forEach((grad, id) => {
        cy.elements(`edge[source = "${id}"]`).data("grad", grad.toFixed(3));
    });
});
