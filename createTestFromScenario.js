/* eslint-disable prefer-template */
const { resolveAndRunStepDefinition } = require("./resolveStepDefinition");

const stepTest = stepDetails => {
  cy.log(`${stepDetails.keyword} ${stepDetails.text}`);
  resolveAndRunStepDefinition(stepDetails);
};

const getExampleValues = example => {
  const exampleValues = [];
  example.tableBody.forEach((row, rowIndex) => {
    example.tableHeader.cells.forEach((header, headerIndex) => {
      exampleValues[rowIndex] = Object.assign({}, exampleValues[rowIndex], {
        [header.value]: row.cells[headerIndex].value
      });
    });
  });
  return exampleValues;
};

const createTestFromScenario = (scenario, backgroundSection, featureTags) => {
  const scenarioTags = scenario.tags;
  if (scenario.examples) {
    scenario.examples.forEach(example => {
      getExampleValues(example).forEach((exampleValue, index) => {
        it(`${scenario.name} (example #${index + 1})`, () => {
          if (backgroundSection) {
            backgroundSection.steps.forEach(stepTest);
          }
          scenario.steps.forEach(step => {
            const newStep = Object.assign({}, step);
            Object.entries(exampleValue).forEach(column => {
              if (newStep.text.includes("<" + column[0] + ">")) {
                newStep.text = newStep.text.replace(
                  "<" + column[0] + ">",
                  column[1]
                );
              }
            });
            stepTest(newStep);
          });
        });
      });
    });
  } else {
    const totalTags = featureTags.concat(scenarioTags);

    if (totalTags.filter(tag => tag.name === "@ignore").length > 0) {
      // ignore scenario due to ignore tag
    } else {
      it(scenario.name, () => {
        if (backgroundSection) {
          backgroundSection.steps.forEach(stepTest);
        }
        scenario.steps.forEach(step => stepTest(step));
      });
    }
  }
};

module.exports = {
  createTestFromScenario
};
