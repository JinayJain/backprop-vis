/**
 * A demonstration of how we can use the automatic differentiation to perform a linear regression.
 */

import * as ops from "./ops";

/**
 * Defining the dataset
 */

let size = 50;
let X_train: number[] = [];
let y_train: number[] = [];

let actual_m = 1.2;
let actual_b = -0.0;

for (let i = 0; i < size; i++) {
    X_train.push(i / size - 0.5);
}

/**
 * Proper shuffling from: https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array
 */
function shuffle(a: any[]) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}

shuffle(X_train);

X_train.forEach((x) => {
    y_train.push(actual_m * x + actual_b);
});

/**
 * Define our line function
 */

let x = ops.variable("x");
let m = ops.variable("m");
let b = ops.variable("b");

let y = ops.add(ops.mul(m, x), b); // y = mx + b

/**
 * Define a loss function. Squared error for this one.
 */

let label = ops.variable("label");
let loss_sub = ops.sub(y, label);
let loss = ops.pow(loss_sub, 2);

// TODO: Finish linear regression w/ gradients

let epochs = 1;

// let params = {
//     m: 5.2,
//     b: -2.9,
// };

let params = {
    m: Math.random(),
    b: Math.random(),
};

let lr = 0.003;

for (let ep = 0; ep < epochs; ep++) {
    for (let i = 0; i < X_train.length; i++) {
        console.log("-----");

        console.log(`X: ${X_train[i]} y: ${y_train[i]}`);

        let curr_loss = loss.compute({
            m: params.m,
            b: params.b,
            x: X_train[i],
            label: y_train[i],
        });
        console.log(`Loss: ${curr_loss}`);
        console.log(`Grads: m: ${loss.gradient(m)} b: ${loss.gradient(b)}`);
        console.log(
            `Values: loss: ${loss.value}, y: ${y.value}, label: ${label.value}`
        );

        params.m -= (1 / X_train.length) * lr * loss.gradient(m);
        params.b -= (1 / X_train.length) * lr * loss.gradient(b);
    }
}
