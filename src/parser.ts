import { Token, TokenType } from "./lexer";
import {
    AdditionNode,
    ComputationNode,
    DivisionNode,
    MultiplicationNode,
    PowerNode,
    SubtractionNode,
    ValueNode,
    VariableNode,
} from "./nodes";

export default class Parser {
    variables: Array<VariableNode>;
    tokens: Array<Token>;
    pos: number;
    error: string;
    constructor(tokens: Array<Token>) {
        this.tokens = tokens;
        this.error = "";
        this.pos = 0;
        this.variables = [];
    }

    public parse(): ComputationNode {
        return this.addsub();
    }

    match(...types: Array<TokenType>): boolean {
        if (
            this.pos < this.tokens.length &&
            types.includes(this.tokens[this.pos].type)
        ) {
            this.pos++;
            return true;
        }

        return false;
    }

    previous(): Token {
        return this.tokens[this.pos - 1];
    }

    addsub(): ComputationNode {
        let expr = this.muldiv();

        while (this.match(TokenType.ADD, TokenType.SUB)) {
            const prev = this.tokens[this.pos - 1];
            const right = this.muldiv();
            if (prev.type == TokenType.ADD) {
                expr = new AdditionNode(expr, right);
            } else {
                expr = new SubtractionNode(expr, right);
            }
        }

        return expr;
    }

    muldiv(): ComputationNode {
        let expr = this.pow();

        while (this.match(TokenType.MUL, TokenType.DIV)) {
            const prev = this.tokens[this.pos - 1];
            const right = this.pow();
            if (prev.type == TokenType.MUL) {
                expr = new MultiplicationNode(expr, right);
            } else {
                expr = new DivisionNode(expr, right);
            }
        }

        return expr;
    }

    pow(): ComputationNode {
        let expr = this.primary();

        while (this.match(TokenType.POW)) {
            const prev = this.tokens[this.pos - 1];
            const right = this.unary();
            expr = new PowerNode(expr, right);
        }

        return expr;
    }

    unary(): ComputationNode {
        if (this.match(TokenType.SUB)) {
            let expr = this.unary();

            return new MultiplicationNode(-1, expr);
        }
        return this.primary();
    }

    primary(): ComputationNode {
        if (this.match(TokenType.NUM)) {
            return new ValueNode(parseFloat(this.previous().literal));
        } else if (this.match(TokenType.VAR)) {
            const v = new VariableNode(this.previous().literal);
            this.variables.push(v);
            return v;
        } else if (this.match(TokenType.LPAR)) {
            let expr = this.addsub();
            this.match(TokenType.RPAR);

            return expr;
        }

        this.error = "Syntax error";
        return new ValueNode(0);
    }
}
