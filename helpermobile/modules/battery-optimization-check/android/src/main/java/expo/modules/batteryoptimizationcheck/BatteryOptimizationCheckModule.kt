package expo.modules.batteryoptimizationcheck

import android.content.Context
import android.os.PowerManager
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class BatteryOptimizationCheckModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("BatteryOptimizationCheck")

    Function("isIgnoringBatteryOptimizations") {
      val context = appContext.reactContext ?: return@Function true
      val powerManager = context.getSystemService(Context.POWER_SERVICE) as PowerManager
      powerManager.isIgnoringBatteryOptimizations(context.packageName)
    }
  }
}
