import * as ops from "./ops";
import cytoscape, { ElementDefinition } from "cytoscape";
import katex from "katex";
import {
    ComputationNode,
    AdditionNode,
    SubtractionNode,
    MultiplicationNode,
    DivisionNode,
    PowerNode,
    ValueNode,
    VariableNode,
} from "./nodes";

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
        return node.value.toString();
    } else if (node instanceof VariableNode) {
        return node.name;
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
                },
            });
            nodeQueue.push(input);
        });
    }

    return graph;
}
let a = ops.variable("a");
let comp = ops.add(ops.mul(5, a), ops.div(2, a));
comp = ops.pow(comp, comp);
comp = ops.add(comp, 53.542);

const output: HTMLElement = document.getElementById("output")!;
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
                "text-halign": "center",
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
                width: 3,
                "curve-style": "bezier",
                "line-color": "#3E6680",
                "source-arrow-shape": "triangle",
                "source-arrow-color": "#4BB3FD",
                "arrow-scale": 2,
            },
        },
    ],
});
