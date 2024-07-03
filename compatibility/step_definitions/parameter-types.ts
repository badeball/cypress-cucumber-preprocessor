import {
  Given,
  defineParameterType,
} from "@badeball/cypress-cucumber-preprocessor";

class Flight {
  constructor(
    public readonly from: string,
    public readonly to: string,
  ) {}
}

defineParameterType({
  name: "flight",
  regexp: /([A-Z]{3})-([A-Z]{3})/,
  transformer(from: string, to: string) {
    return new Flight(from, to);
  },
});

Given("{flight} has been delayed", function (flight: Flight) {
  expect(flight.from).to.equal("LHR");
  expect(flight.to).to.equal("CDG");
});
