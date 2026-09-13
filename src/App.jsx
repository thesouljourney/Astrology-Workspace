import CaseWorkspace from "./components/caseWorkspace/CaseWorkspace.jsx";
import "./App.css";

/**
 * Targeted UX Refinement: the standalone Quick Calculator is no longer a
 * user-facing entry point. Cases is now the app's only top-level
 * destination - "one person = one Case = one complete astrology
 * workspace." The locked calculation engine (`calculateChart()` and
 * everything under `src/astrology/`) is untouched and unchanged; Case
 * creation/editing (`CaseManager.jsx`/`EditCaseForm.jsx`) already calls
 * it via the existing `computeCaseChart()` bridge, exactly as before.
 * The display components previously shown on the Quick Calculator page
 * (`ModernWestern`/`ClassicalAstrology`/`VedicAstrology`/
 * `CrossSystemEvidence`/`ChartMetaAndHouses`/shared `BirthDataFields`)
 * are all still in active use - inside a Case's Chart Data tab
 * (`CaseChartData.jsx`) and its Create/Edit Case forms - so nothing
 * reusable was deleted. `TopicRetrieval.jsx` (the Quick Calculator's own
 * topic browser, functionally superseded by each Case's own Topics tab)
 * is left in place, unused but preserved, rather than deleted.
 */
function App() {
  return (
    <div className="workspace">
      <header>
        <h1>Personal Astrology Workspace｜个人占星工作台</h1>
        <p className="subtitle">Case-Centered Interpretation Workspace｜以案例为中心的解盘工作台</p>
      </header>

      <CaseWorkspace />
    </div>
  );
}

export default App;
