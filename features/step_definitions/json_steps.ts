import { Then } from "@cucumber/cucumber";
import path from "path";
import fs from "fs/promises";
import assert from "assert";
import { PNG } from "pngjs";
import ICustomWorld from "../support/ICustomWorld";

function isObject(object: any): object is object {
  return typeof object === "object" && object != null;
}

function hasOwnProperty<X extends object, Y extends PropertyKey>(
  obj: X,
  prop: Y,
): obj is X & Record<Y, unknown> {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

function* traverseTree(object: any): Generator<object, void, any> {
  if (!isObject(object)) {
    throw new Error(`Expected object, got ${typeof object}`);
  }

  yield object;

  for (const property of Object.values(object)) {
    if (isObject(property)) {
      yield* traverseTree(property);
    }
  }
}

function prepareJsonReport(tree: any) {
  for (const node of traverseTree(tree)) {
    if (hasOwnProperty(node, "duration")) {
      node.duration = 0;
    } else if (hasOwnProperty(node, "uri") && typeof node.uri === "string") {
      node.uri = node.uri.replace(/\\/g, "/");
    } else if (
      hasOwnProperty(node, "location") &&
      typeof node.location === "string"
    ) {
      node.location = node.location.replace(/\\/g, "/");
    }
  }

  return tree;
}

Then("there should be no JSON output", async function (this: ICustomWorld) {
  await assert.rejects(
    () => fs.readFile(path.join(this.tmpDir, "cucumber-report.json")),
    {
      code: "ENOENT",
    },
    "Expected there to be no JSON file",
  );
});

Then(
  "there should be a JSON output similar to {string}",
  async function (this: ICustomWorld, fixturePath) {
    const absolutejsonPath = path.join(this.tmpDir, "cucumber-report.json");

    const json = await fs.readFile(absolutejsonPath);

    const absoluteExpectedJsonpath = path.join(
      process.cwd(),
      "features",
      fixturePath,
    );

    const actualJsonOutput = prepareJsonReport(JSON.parse(json.toString()));

    if (process.env.WRITE_FIXTURES) {
      await fs.writeFile(
        absoluteExpectedJsonpath,
        JSON.stringify(actualJsonOutput, null, 2) + "\n",
      );
    } else {
      const expectedJsonOutput = JSON.parse(
        (await fs.readFile(absoluteExpectedJsonpath)).toString(),
      );
      assert.deepStrictEqual(actualJsonOutput, expectedJsonOutput);
    }
  },
);

Then(
  "the JSON report should contain an image attachment for what appears to be a screenshot",
  async function (this: ICustomWorld) {
    const absolutejsonPath = path.join(this.tmpDir, "cucumber-report.json");

    const jsonFile = await fs.readFile(absolutejsonPath);

    const actualJsonOutput = JSON.parse(jsonFile.toString());

    const embeddings: { data: string; mime_type: string }[] = actualJsonOutput
      .flatMap((feature: any) => feature.elements)
      .flatMap((element: any) => element.steps)
      .flatMap((step: any) => step.embeddings ?? []);

    if (embeddings.length === 0) {
      throw new Error("Expected to find an embedding in JSON, but found none");
    } else if (embeddings.length > 1) {
      throw new Error(
        "Expected to find a single embedding in JSON, but found " +
          embeddings.length,
      );
    }

    const [embedding] = embeddings;

    assert.strictEqual(embedding.mime_type, "image/png");

    const png = await new Promise<PNG>((resolve, reject) => {
      new PNG().parse(
        Buffer.from(embedding.data, "base64"),
        function (error, data) {
          if (error) {
            reject(error);
          } else {
            resolve(data);
          }
        },
      );
    });

    const expectedDimensions = {
      width: 1280,
      height: 720,
    };

    const { width: actualWidth, height: actualHeight } = png;

    assert.strictEqual(actualWidth, expectedDimensions.width);
    assert.strictEqual(actualHeight, expectedDimensions.height);
  },
);

Then(
  "there should be two attachments containing false and true, respectively",
  async function (this: ICustomWorld) {
    const absolutejsonPath = path.join(this.tmpDir, "cucumber-report.json");

    const jsonFile = await fs.readFile(absolutejsonPath);

    const actualJsonOutput = JSON.parse(jsonFile.toString());

    const embeddings: { data: string; mime_type: string }[] = actualJsonOutput
      .flatMap((feature: any) => feature.elements)
      .flatMap((element: any) => element.steps)
      .flatMap((step: any) => step.embeddings ?? []);

    if (embeddings.length !== 2) {
      throw new Error(
        "Expected to find two embeddings in JSON, but found " +
          embeddings.length,
      );
    }

    const [first, second] = embeddings;

    assert.strictEqual(
      Buffer.from(first.data, "base64").toString(),
      "false",
      "Expected first attachment to equal 'false'",
    );

    assert.strictEqual(
      Buffer.from(second.data, "base64").toString(),
      "true",
      "Expected second attachment to equal 'true'",
    );
  },
);

Then(
  "there should be one attachment containing {string}",
  async function (this: ICustomWorld, content) {
    const absolutejsonPath = path.join(this.tmpDir, "cucumber-report.json");

    const jsonFile = await fs.readFile(absolutejsonPath);

    const actualJsonOutput = JSON.parse(jsonFile.toString());

    const embeddings: { data: string; mime_type: string }[] = actualJsonOutput
      .flatMap((feature: any) => feature.elements)
      .flatMap((element: any) => element.steps)
      .flatMap((step: any) => step.embeddings ?? []);

    if (embeddings.length !== 1) {
      throw new Error(
        "Expected to find one embeddings in JSON, but found " +
          embeddings.length,
      );
    }

    assert.strictEqual(
      Buffer.from(embeddings[0].data, "base64").toString(),
      content,
    );
  },
);

Then(
  "the JSON report should contain a spec",
  async function (this: ICustomWorld) {
    const absolutejsonPath = path.join(this.tmpDir, "cucumber-report.json");

    const jsonFile = await fs.readFile(absolutejsonPath);

    const actualJsonOutput = JSON.parse(jsonFile.toString());

    if (actualJsonOutput.length !== 1) {
      throw new Error(
        `Expected to find a single spec, but found ${actualJsonOutput.length}`,
      );
    }
  },
);

Then(
  "the JSON report shouldn't contain any specs",
  async function (this: ICustomWorld) {
    const absolutejsonPath = path.join(this.tmpDir, "cucumber-report.json");

    const jsonFile = await fs.readFile(absolutejsonPath);

    const actualJsonOutput = JSON.parse(jsonFile.toString());

    if (actualJsonOutput.length > 0) {
      throw new Error(
        `Expected to find zero specs, but found ${actualJsonOutput.length}`,
      );
    }
  },
);

Then(
  "the JSON report should contain {int} tests",
  async function (this: ICustomWorld, n: number) {
    const absolutejsonPath = path.join(this.tmpDir, "cucumber-report.json");

    const jsonFile = await fs.readFile(absolutejsonPath);

    const actualJsonOutput = JSON.parse(jsonFile.toString());

    const elements = actualJsonOutput.flatMap((spec: any) => spec.elements);

    if (elements.length !== n) {
      throw new Error(
        `Expected to find ${n} tests, but found ${elements.length}`,
      );
    }
  },
);
