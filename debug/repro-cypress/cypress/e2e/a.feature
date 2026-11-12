Feature: Dashboard rendering under load

  # Reproduces "Unexpected state in afterSpecHandler: has-reloaded".
  #
  # The Scenario Outline renders many heavy pages in one spec (the field crash
  # appeared on specs with >10 scenarios under memory pressure). The final
  # scenario deterministically crashes the GPU process, which makes Cypress
  # recover by re-firing before:spec (state -> "has-reloaded") without re-running
  # the spec, so after:spec fires while still in "has-reloaded".

  Scenario Outline: render the dashboard for account <account>
    Given I open the dashboard for account "<account>"
    Then I see the account heading for "<account>"
    And the dashboard has finished rendering

    Examples:
      | account |
      | 1000    |
      | 1001    |
      | 1002    |
      | 1003    |
      | 1004    |
      | 1005    |
      | 1006    |
      | 1007    |
      | 1008    |
      | 1009    |
      | 1010    |
      | 1011    |

  Scenario: the GPU runs out of memory while rendering
    Given I open the dashboard for account "1012"
    When the GPU process runs out of memory
    Then the report is still generated
