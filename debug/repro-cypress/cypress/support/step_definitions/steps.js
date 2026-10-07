const { Given, When, Then } = require("@badeball/cypress-cucumber-preprocessor");

/**
 * Two reproduction modes, switchable without touching the feature:
 *
 *   crashMode = "cdp"    (default) Deterministic. Renders real pages
 *                        (https://example.org) and crashes the GPU process on
 *                        demand via CDP. Reproduces reliably on any machine.
 *                        Run: npx cypress run --browser electron
 *
 *   crashMode = "memory" Organic / self-contained. Renders a heavy local page
 *                        (no network) and exhausts GPU memory with WebGL until
 *                        the GPU process crashes by itself -- the raw field
 *                        scenario. No network, but timing-dependent (may need
 *                        more scenarios / bigger allocations on a beefy box).
 *                        Run: npx cypress run --browser electron --env crashMode=memory
 */
const MODE = Cypress.env("crashMode") || "cdp";

Given("I open the dashboard for account {string}", (account) => {
  if (MODE === "memory") {
    // Self-contained heavy page (served from the project by Cypress).
    cy.visit(`/cypress/fixtures/dashboard.html?account=${account}`);
  } else {
    // Real navigation, like the plugin's own @network reload tests.
    cy.visit(`https://example.org/?account=${account}`);
  }
});

Then("I see the account heading for {string}", () => {
  cy.get("h1").should("be.visible");
});

Then("the dashboard has finished rendering", () => {
  cy.get("body").should("be.visible");
});

When("the GPU process runs out of memory", () => {
  if (MODE === "memory") {
    // Exhaust GPU memory from within the page until the GPU process dies.
    cy.window().then((win) => {
      for (let i = 0; i < 400; i++) {
        const canvas = win.document.createElement("canvas");
        canvas.width = 4096;
        canvas.height = 4096;
        const gl =
          canvas.getContext("webgl2") || canvas.getContext("webgl");
        if (gl) {
          const tex = gl.createTexture();
          gl.bindTexture(gl.TEXTURE_2D, tex);
          gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            4096,
            4096,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            null,
          );
        }
        win.document.body.appendChild(canvas);
      }
    });
  } else {
    // Deterministic GPU-process crash via CDP. A *GPU* crash (unlike a
    // *renderer* crash, which afterSpecHandler catches via browserCrashExprCol)
    // is not matched, so Cypress's recovery leaves the plugin in "has-reloaded"
    // when after:spec fires -- the field signature "GPU process exited
    // unexpectedly: exit_code=15", triggered on demand.
    cy.wrap(null).then(() =>
      Cypress.automation("remote:debugger:protocol", {
        command: "Browser.crashGpuProcess",
        params: {},
      }),
    );
  }
  cy.wait(5000); // let the crash / recovery happen before the spec ends
});

Then("the report is still generated", () => {
  cy.log("after:spec must not crash on the has-reloaded state");
});
