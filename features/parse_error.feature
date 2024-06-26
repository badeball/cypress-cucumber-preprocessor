Feature: parse errors

  Scenario: tagged rules
    Given a file named "cypress/e2e/a.feature" with:
      """
      Feature: a feature name
        @tag
        Background: a backgrund name
      """
    When I run cypress
    Then it fails
    And the output should contain
      """
      (3:3): expected: #TagLine, #RuleLine, #Comment, #Empty, got 'Background: a backgrund name'
      """
