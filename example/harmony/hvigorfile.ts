import { appTasks } from '@ohos/hvigor-ohos-plugin';
import { createRNOHModulePlugin } from "@rnoh/hvigor-plugin"

export default {
  system: appTasks, /* Built-in plugin of Hvigor. It cannot be modified. */
  plugins: [
    createRNOHModulePlugin({
      nodeModulesPath: "../node_modules",
      codegen: null,
      autolinking: {}
    }),
  ]       /* Custom plugin to extend the functionality of Hvigor. */
}