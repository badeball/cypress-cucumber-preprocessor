import {
  attach,
  link,
  log,
  When,
} from "@badeball/cypress-cucumber-preprocessor";

When(
  "the string {string} is attached as {string}",
  function (text: string, mediaType: string) {
    attach(text, mediaType);
  },
);

When("the string {string} is logged", function (text: string) {
  log(text);
});

When("text with ANSI escapes is logged", function () {
  log(
    "This displays a \x1b[31mr\x1b[0m\x1b[91ma\x1b[0m\x1b[33mi\x1b[0m\x1b[32mn\x1b[0m\x1b[34mb\x1b[0m\x1b[95mo\x1b[0m\x1b[35mw\x1b[0m",
  );
});

When(
  "the following string is attached as {string}:",
  function (mediaType: string, text: string) {
    attach(text, mediaType);
  },
);

When(
  "an array with {int} bytes is attached as {string}",
  function (size: number, mediaType: string) {
    const data = [...Array(size).keys()];
    const buffer = new Uint8Array(data).buffer;
    attach(buffer, mediaType);
  },
);

When("a PDF document is attached and renamed", function () {
  cy.readFile("document.pdf", "base64").then((file) =>
    attach(file, {
      mediaType: "base64:application/pdf",
      fileName: "renamed.pdf",
    }),
  );
});

When("a link to {string} is attached", function (uri: string) {
  link(uri);
});

When(
  "the string {string} is attached as {string} before a failure",
  function (text: string, mediaType: string) {
    attach(text, mediaType).then(() => {
      throw new Error("whoops");
    });
  },
);
