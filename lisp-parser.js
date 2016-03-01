let lisp = '(+ 1 2 (- 4 (- 5 434) (- 1 0)) (- 6 1 (+ 1 1) 1) 5)';
let expected = [
  '+',
  1,
  2,
  [ '-', 4, [ '-', 5, 44 ], [ '-', 1, 0 ] ], // 432
  [ '-', 6, 1, [ '+', 1, 1 ], 1 ], // 2
  5
];

const printError = (description, input, expected) => {
  console.log(description);
  console.log('Expected:', expected);
  console.log('Got:', input);
}

function assertEqual(description, input, expected, errorMsg=true) {
  if (!input.length) {
    if (input === expected) {
      return true;
    } else {
      printError(description, input, expected);
      return false;
    }
  }

  for (let i = 0; i < input.length; i++) {
    const item = input[i];
    const expectedItem = expected[i];

    let equal;

    if (typeof item === 'object') {
      equal = assertEqual(description, item, expectedItem, false);
    } else {
      equal = item === expectedItem;
    }

    if (!equal) {
      if (errorMsg) printError(description, input, expected);
      return false;
    }
  }

  return true;
};

////////////////////////////////////////

function evaluateToken(token) {
  if (token === '') return;

  let numbered = Number(token);

  if (token === 'true') {
    return { type: 'boolean', value: true };

  } else if (token === 'false') {
    return { type: 'boolean', value: false };

  // if coercing the token into a number doesn't return NaN
  } else if (token == numbered) {
    return { type: 'number', value: numbered };

  } else if (token === '(') {
    return { type: 'startExpression', value: token };

  } else if (token === ')') {
    return { type: 'endExpression', value: token };

  } else {
    return { type: 'token', value: token };
  }
}

function tokenize(expression) {
  const output = [];

  let currentToken = '';

  const resetToken = () => {
    currentToken = '';
  };

  const logToken = (input) => {
    const token = evaluateToken(input);
    if (token) {
      output.push(token);
    }
  }

  for (let i = 0; i < expression.length; i++) {
    let char = expression[i];

    if (char === '(') {
      logToken(char);
      resetToken();

    } else if (char === ')') {
      logToken(currentToken);
      resetToken();
      logToken(char);

    } else if (char === ' ' && currentToken) {
      logToken(currentToken);
      resetToken();

    } else {
      currentToken += char
    }
  }

  return output;
}

function findExpressionSize(tokens) {
  if (tokens[0].type !== 'startExpression') {
    throw 'Expression must start with "("';
  }

  let parenCount = 1;
  let ix = 1;

  for (; parenCount; ix++) {
    const token = tokens[ix];

    if (token.type === 'startExpression') {
      parenCount += 1;

    } else if (token.type === 'endExpression') {
      parenCount -= 1;
    }
  }

  return ix;
}

function parse(tokenInput) {
  const tokens = tokenInput.slice(1, -1);
  const output = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token.type === 'startExpression') {
      // How many tokens ahead does the expression end in?
      const expressionSize = findExpressionSize(tokens.slice(i));
      const expression = tokens.slice(i, i + expressionSize);
      output.push( parse(expression) );

      i += expressionSize - 1;

    } else {
      output.push(token.value);
    }
  }

  return output;
}

const functionMap = {
  '+': (...args) => args.reduce((acc, item) => acc + item),
  '-': (...args) => args.reduce((acc, item) => acc - item),
  '**': Math.pow,
  max: Math.max,
  min: Math.min
};

function interpret(expression) {
  const fn = functionMap[expression[0]];
  const args = expression.slice(1).map(arg => {
    if (typeof arg === 'object') {
      return interpret(arg);
    } else {
      return arg;
    }
  });

  return fn(...args);
}

function run(string) {
  const tokens = tokenize(string);
  return parse(tokens);
}

function evaluate(string) {
  const parsed = run(string);
  return interpret(parsed);
}

console.log(
  assertEqual('Parsing',
    run(lisp),
    expected
  )
);

console.log(
  assertEqual('Evaluation',
    evaluate(lisp),
    442
  )
);
