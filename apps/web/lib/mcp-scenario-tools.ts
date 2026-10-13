import 'server-only'
import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { getScenarioDashboardView } from './scenario-dashboard'
import { SCENARIO_RUN_STATUSES, toScenarioToolView } from './mcp-scenario-view'

// scenarios-light-up S2.1 — the connector's scenario READ. Scoped to the ONE project the connector
// token resolved; the input schema has no project parameter. Deliberately no write tool (D6): writes
// go through `frijoles scenarios`.
export function registerScenarioTools(server: McpServer, projectId: string): void {
  server.registerTool(
    'list_scenarios',
    {
      description:
        "List this project's scenarios (drills): verified targets, registered definitions and their runs with state. Read-only; writes go through the frijoles CLI.",
      inputSchema: {
        status: z.enum(SCENARIO_RUN_STATUSES).optional().describe('Only runs in this status.'),
      },
    },
    async ({ status }) => {
      const view = await getScenarioDashboardView(projectId)
      return { content: [{ type: 'text' as const, text: JSON.stringify(toScenarioToolView(view, status)) }] }
    }
  )
}
