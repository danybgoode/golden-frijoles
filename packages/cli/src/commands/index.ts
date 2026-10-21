// golden-frijoles-cli — the command table. `--help` is rendered from it and the dispatcher reads it,
// so a verb cannot exist undocumented and cannot be documented without existing.
//
// ORDER IS THE HELP'S ORDER. It runs roughly in the sequence a new user meets them: sign in, find
// your project, set the project up, then work with flags.

import type { Command } from '../command'
import { loginCommand, logoutCommand, whoamiCommand } from './auth'
import {
  projectsCreateCommand,
  projectsDeleteCommand,
  projectsLsCommand,
  projectsPurgeCommand,
  projectsUseCommand,
} from './projects'
import { initCommand } from './init'
import { flagsGetCommand, flagsLsCommand } from './flags-read'
import {
  flagsCreateCommand,
  flagsKillCommand,
  flagsRolloutCommand,
  flagsRulesCommand,
  flagsSetCommand,
} from './flags-write'
import { flagsDiffCommand, flagsHistoryCommand } from './flags-history'
import { flagsSyncCommand } from './flags-sync'
import { northStarSetCommand } from './north-star'
import {
  scenariosDefineCommand,
  scenariosLaunchCommand,
  scenariosLsCommand,
  scenariosRunsCommand,
  scenariosImpactCommand,
  scenariosStopCommand,
  scenariosTargetsAddCommand,
  scenariosTargetsRevokeCommand,
  scenariosTargetsVerifyCommand,
} from './scenarios'
import { statusCommand } from './status'
import { horizonCommand } from './horizon'
import { funnelCommand } from './funnel'
import { segmentsDefineCommand, segmentsLsCommand } from './segments'
import { betSyncCommand } from './bet'
import { experimentsDecisionCommand, northStarReadingsCommand } from './result-reads'
import {
  experimentsCreateCommand,
  experimentsDecideCommand,
  experimentsDeleteCommand,
  experimentsLsCommand,
  experimentsPauseCommand,
  experimentsResumeCommand,
  experimentsShowCommand,
  experimentsStartCommand,
  experimentsStopCommand,
} from './experiments'
import { keysCreateCommand, keysLsCommand, keysRevokeCommand } from './keys'
import { doctorCommand } from './doctor'
import { updateCommand, versionCommand } from './update'
import { configGetCommand, configListCommand, configSetCommand, setupCommand } from './config'

export const COMMANDS: readonly Command[] = [
  loginCommand,
  logoutCommand,
  whoamiCommand,
  doctorCommand,
  versionCommand,
  updateCommand,
  setupCommand,
  configListCommand,
  configGetCommand,
  configSetCommand,
  initCommand,
  projectsLsCommand,
  projectsCreateCommand,
  projectsUseCommand,
  projectsDeleteCommand,
  projectsPurgeCommand,
  flagsLsCommand,
  flagsGetCommand,
  flagsCreateCommand,
  flagsSetCommand,
  flagsRolloutCommand,
  flagsRulesCommand,
  flagsKillCommand,
  flagsDiffCommand,
  flagsHistoryCommand,
  flagsSyncCommand,
  northStarSetCommand,
  northStarReadingsCommand,
  scenariosLsCommand,
  scenariosTargetsAddCommand,
  scenariosTargetsVerifyCommand,
  scenariosTargetsRevokeCommand,
  scenariosDefineCommand,
  scenariosLaunchCommand,
  scenariosStopCommand,
  scenariosRunsCommand,
  scenariosImpactCommand,
  statusCommand,
  horizonCommand,
  funnelCommand,
  segmentsDefineCommand,
  segmentsLsCommand,
  betSyncCommand,
  experimentsLsCommand,
  experimentsShowCommand,
  experimentsCreateCommand,
  experimentsStartCommand,
  experimentsPauseCommand,
  experimentsResumeCommand,
  experimentsStopCommand,
  experimentsDecideCommand,
  experimentsDeleteCommand,
  experimentsDecisionCommand,
  keysLsCommand,
  keysCreateCommand,
  keysRevokeCommand,
]
