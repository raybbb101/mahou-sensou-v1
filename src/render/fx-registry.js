// tools/gen-fx-registry.mjs が生成。手で編集しない。
import * as fx_arcane_arcane_beam from "../../vendor/pixelfx/src/fx/arcane/arcane-beam.js";
import * as fx_arcane_arcane_missiles from "../../vendor/pixelfx/src/fx/arcane/arcane-missiles.js";
import * as fx_arcane_arcane_orb from "../../vendor/pixelfx/src/fx/arcane/arcane-orb.js";
import * as fx_arcane_blink_in from "../../vendor/pixelfx/src/fx/arcane/blink-in.js";
import * as fx_arcane_blink_out from "../../vendor/pixelfx/src/fx/arcane/blink-out.js";
import * as fx_arcane_magic_circle_cast from "../../vendor/pixelfx/src/fx/arcane/magic-circle-cast.js";
import * as fx_arcane_mana_burst from "../../vendor/pixelfx/src/fx/arcane/mana-burst.js";
import * as fx_arcane_portal from "../../vendor/pixelfx/src/fx/arcane/portal.js";
import * as fx_arcane_rune_circle from "../../vendor/pixelfx/src/fx/arcane/rune-circle.js";
import * as fx_arcane_spell_charge from "../../vendor/pixelfx/src/fx/arcane/spell-charge.js";
import * as fx_arcane_star_fall from "../../vendor/pixelfx/src/fx/arcane/star-fall.js";
import * as fx_arcane_time_stop from "../../vendor/pixelfx/src/fx/arcane/time-stop.js";
import * as fx_explosions_implosion from "../../vendor/pixelfx/src/fx/explosions/implosion.js";
import * as fx_explosions_plasma_explosion from "../../vendor/pixelfx/src/fx/explosions/plasma-explosion.js";
import * as fx_explosions_smoke_bomb from "../../vendor/pixelfx/src/fx/explosions/smoke-bomb.js";
import * as fx_fire_fire_breath from "../../vendor/pixelfx/src/fx/fire/fire-breath.js";
import * as fx_fire_fire_ring from "../../vendor/pixelfx/src/fx/fire/fire-ring.js";
import * as fx_fire_fire_tornado from "../../vendor/pixelfx/src/fx/fire/fire-tornado.js";
import * as fx_fire_fireball from "../../vendor/pixelfx/src/fx/fire/fireball.js";
import * as fx_fire_flame_pillar from "../../vendor/pixelfx/src/fx/fire/flame-pillar.js";
import * as fx_fire_flamethrower from "../../vendor/pixelfx/src/fx/fire/flamethrower.js";
import * as fx_fire_meteor from "../../vendor/pixelfx/src/fx/fire/meteor.js";
import * as fx_holy_blessing from "../../vendor/pixelfx/src/fx/holy/blessing.js";
import * as fx_holy_divine_shield from "../../vendor/pixelfx/src/fx/holy/divine-shield.js";
import * as fx_holy_feather_burst from "../../vendor/pixelfx/src/fx/holy/feather-burst.js";
import * as fx_holy_halo from "../../vendor/pixelfx/src/fx/holy/halo.js";
import * as fx_holy_heal from "../../vendor/pixelfx/src/fx/holy/heal.js";
import * as fx_holy_heal_aoe from "../../vendor/pixelfx/src/fx/holy/heal-aoe.js";
import * as fx_holy_holy_pillar from "../../vendor/pixelfx/src/fx/holy/holy-pillar.js";
import * as fx_holy_smite from "../../vendor/pixelfx/src/fx/holy/smite.js";
import * as fx_holy_sunburst from "../../vendor/pixelfx/src/fx/holy/sunburst.js";
import * as fx_ice_blizzard_vortex from "../../vendor/pixelfx/src/fx/ice/blizzard-vortex.js";
import * as fx_ice_freeze from "../../vendor/pixelfx/src/fx/ice/freeze.js";
import * as fx_ice_frost_breath from "../../vendor/pixelfx/src/fx/ice/frost-breath.js";
import * as fx_ice_frost_nova from "../../vendor/pixelfx/src/fx/ice/frost-nova.js";
import * as fx_ice_ice_lance from "../../vendor/pixelfx/src/fx/ice/ice-lance.js";
import * as fx_ice_ice_shatter from "../../vendor/pixelfx/src/fx/ice/ice-shatter.js";
import * as fx_ice_ice_spikes from "../../vendor/pixelfx/src/fx/ice/ice-spikes.js";
import * as fx_lightning_ball_lightning from "../../vendor/pixelfx/src/fx/lightning/ball-lightning.js";
import * as fx_lightning_chain_lightning from "../../vendor/pixelfx/src/fx/lightning/chain-lightning.js";
import * as fx_lightning_charge_up from "../../vendor/pixelfx/src/fx/lightning/charge-up.js";
import * as fx_lightning_lightning_strike from "../../vendor/pixelfx/src/fx/lightning/lightning-strike.js";
import * as fx_lightning_plasma_ball from "../../vendor/pixelfx/src/fx/lightning/plasma-ball.js";
import * as fx_lightning_storm_cloud from "../../vendor/pixelfx/src/fx/lightning/storm-cloud.js";
import * as fx_lightning_thunderclap from "../../vendor/pixelfx/src/fx/lightning/thunderclap.js";
import * as fx_lightning_zap_hit from "../../vendor/pixelfx/src/fx/lightning/zap-hit.js";
import * as fx_nature_acid_splash from "../../vendor/pixelfx/src/fx/nature/acid-splash.js";
import * as fx_nature_earth_spike from "../../vendor/pixelfx/src/fx/nature/earth-spike.js";
import * as fx_nature_healing_bloom from "../../vendor/pixelfx/src/fx/nature/healing-bloom.js";
import * as fx_nature_leaf_storm from "../../vendor/pixelfx/src/fx/nature/leaf-storm.js";
import * as fx_nature_poison_cloud from "../../vendor/pixelfx/src/fx/nature/poison-cloud.js";
import * as fx_nature_root_snare from "../../vendor/pixelfx/src/fx/nature/root-snare.js";
import * as fx_nature_tornado from "../../vendor/pixelfx/src/fx/nature/tornado.js";
import * as fx_nature_toxic_puddle from "../../vendor/pixelfx/src/fx/nature/toxic-puddle.js";
import * as fx_nature_vine_whip from "../../vendor/pixelfx/src/fx/nature/vine-whip.js";
import * as fx_projectiles_magic_missile from "../../vendor/pixelfx/src/fx/projectiles/magic-missile.js";
import * as fx_projectiles_plasma_shot from "../../vendor/pixelfx/src/fx/projectiles/plasma-shot.js";
import * as fx_scifi_emp_blast from "../../vendor/pixelfx/src/fx/scifi/emp-blast.js";
import * as fx_scifi_force_field from "../../vendor/pixelfx/src/fx/scifi/force-field.js";
import * as fx_shadow_black_hole from "../../vendor/pixelfx/src/fx/shadow/black-hole.js";
import * as fx_shadow_curse from "../../vendor/pixelfx/src/fx/shadow/curse.js";
import * as fx_shadow_dark_explosion from "../../vendor/pixelfx/src/fx/shadow/dark-explosion.js";
import * as fx_shadow_eclipse from "../../vendor/pixelfx/src/fx/shadow/eclipse.js";
import * as fx_shadow_grasping_hands from "../../vendor/pixelfx/src/fx/shadow/grasping-hands.js";
import * as fx_shadow_hex_sigil from "../../vendor/pixelfx/src/fx/shadow/hex-sigil.js";
import * as fx_shadow_life_steal from "../../vendor/pixelfx/src/fx/shadow/life-steal.js";
import * as fx_shadow_necro_skulls from "../../vendor/pixelfx/src/fx/shadow/necro-skulls.js";
import * as fx_shadow_shadow_flames from "../../vendor/pixelfx/src/fx/shadow/shadow-flames.js";
import * as fx_shadow_shadow_tendrils from "../../vendor/pixelfx/src/fx/shadow/shadow-tendrils.js";
import * as fx_shadow_soul_drain from "../../vendor/pixelfx/src/fx/shadow/soul-drain.js";
import * as fx_shadow_void_orb from "../../vendor/pixelfx/src/fx/shadow/void-orb.js";
import * as fx_spawn_shatter_death from "../../vendor/pixelfx/src/fx/spawn/shatter-death.js";
import * as fx_spawn_soul_rise from "../../vendor/pixelfx/src/fx/spawn/soul-rise.js";
import * as fx_spawn_spawn_portal from "../../vendor/pixelfx/src/fx/spawn/spawn-portal.js";
import * as fx_spawn_summon_rise from "../../vendor/pixelfx/src/fx/spawn/summon-rise.js";
import * as fx_status_bleeding from "../../vendor/pixelfx/src/fx/status/bleeding.js";
import * as fx_status_burning from "../../vendor/pixelfx/src/fx/status/burning.js";
import * as fx_status_charmed from "../../vendor/pixelfx/src/fx/status/charmed.js";
import * as fx_status_confused from "../../vendor/pixelfx/src/fx/status/confused.js";
import * as fx_status_cursed from "../../vendor/pixelfx/src/fx/status/cursed.js";
import * as fx_status_frozen from "../../vendor/pixelfx/src/fx/status/frozen.js";
import * as fx_status_haste from "../../vendor/pixelfx/src/fx/status/haste.js";
import * as fx_status_petrified from "../../vendor/pixelfx/src/fx/status/petrified.js";
import * as fx_status_poisoned from "../../vendor/pixelfx/src/fx/status/poisoned.js";
import * as fx_status_rage from "../../vendor/pixelfx/src/fx/status/rage.js";
import * as fx_status_sleep from "../../vendor/pixelfx/src/fx/status/sleep.js";
import * as fx_status_slowed from "../../vendor/pixelfx/src/fx/status/slowed.js";
import * as fx_status_stunned from "../../vendor/pixelfx/src/fx/status/stunned.js";
import * as fx_water_bubbles from "../../vendor/pixelfx/src/fx/water/bubbles.js";
import * as fx_water_splash from "../../vendor/pixelfx/src/fx/water/splash.js";
import * as fx_water_water_jet from "../../vendor/pixelfx/src/fx/water/water-jet.js";
import * as fx_water_water_orb from "../../vendor/pixelfx/src/fx/water/water-orb.js";
import * as fx_weather_aurora from "../../vendor/pixelfx/src/fx/weather/aurora.js";
import * as fx_weather_blizzard from "../../vendor/pixelfx/src/fx/weather/blizzard.js";
import * as fx_weather_cherry_blossoms from "../../vendor/pixelfx/src/fx/weather/cherry-blossoms.js";
import * as fx_weather_clouds from "../../vendor/pixelfx/src/fx/weather/clouds.js";
import * as fx_weather_falling_leaves from "../../vendor/pixelfx/src/fx/weather/falling-leaves.js";
import * as fx_weather_fireflies from "../../vendor/pixelfx/src/fx/weather/fireflies.js";
import * as fx_weather_fog from "../../vendor/pixelfx/src/fx/weather/fog.js";
import * as fx_weather_god_rays from "../../vendor/pixelfx/src/fx/weather/god-rays.js";
import * as fx_weather_rain from "../../vendor/pixelfx/src/fx/weather/rain.js";
import * as fx_weather_shooting_stars from "../../vendor/pixelfx/src/fx/weather/shooting-stars.js";
import * as fx_weather_snow from "../../vendor/pixelfx/src/fx/weather/snow.js";
import * as fx_weather_storm from "../../vendor/pixelfx/src/fx/weather/storm.js";

export const FX = {
  "arcane/arcane-beam": fx_arcane_arcane_beam,
  "arcane/arcane-missiles": fx_arcane_arcane_missiles,
  "arcane/arcane-orb": fx_arcane_arcane_orb,
  "arcane/blink-in": fx_arcane_blink_in,
  "arcane/blink-out": fx_arcane_blink_out,
  "arcane/magic-circle-cast": fx_arcane_magic_circle_cast,
  "arcane/mana-burst": fx_arcane_mana_burst,
  "arcane/portal": fx_arcane_portal,
  "arcane/rune-circle": fx_arcane_rune_circle,
  "arcane/spell-charge": fx_arcane_spell_charge,
  "arcane/star-fall": fx_arcane_star_fall,
  "arcane/time-stop": fx_arcane_time_stop,
  "explosions/implosion": fx_explosions_implosion,
  "explosions/plasma-explosion": fx_explosions_plasma_explosion,
  "explosions/smoke-bomb": fx_explosions_smoke_bomb,
  "fire/fire-breath": fx_fire_fire_breath,
  "fire/fire-ring": fx_fire_fire_ring,
  "fire/fire-tornado": fx_fire_fire_tornado,
  "fire/fireball": fx_fire_fireball,
  "fire/flame-pillar": fx_fire_flame_pillar,
  "fire/flamethrower": fx_fire_flamethrower,
  "fire/meteor": fx_fire_meteor,
  "holy/blessing": fx_holy_blessing,
  "holy/divine-shield": fx_holy_divine_shield,
  "holy/feather-burst": fx_holy_feather_burst,
  "holy/halo": fx_holy_halo,
  "holy/heal": fx_holy_heal,
  "holy/heal-aoe": fx_holy_heal_aoe,
  "holy/holy-pillar": fx_holy_holy_pillar,
  "holy/smite": fx_holy_smite,
  "holy/sunburst": fx_holy_sunburst,
  "ice/blizzard-vortex": fx_ice_blizzard_vortex,
  "ice/freeze": fx_ice_freeze,
  "ice/frost-breath": fx_ice_frost_breath,
  "ice/frost-nova": fx_ice_frost_nova,
  "ice/ice-lance": fx_ice_ice_lance,
  "ice/ice-shatter": fx_ice_ice_shatter,
  "ice/ice-spikes": fx_ice_ice_spikes,
  "lightning/ball-lightning": fx_lightning_ball_lightning,
  "lightning/chain-lightning": fx_lightning_chain_lightning,
  "lightning/charge-up": fx_lightning_charge_up,
  "lightning/lightning-strike": fx_lightning_lightning_strike,
  "lightning/plasma-ball": fx_lightning_plasma_ball,
  "lightning/storm-cloud": fx_lightning_storm_cloud,
  "lightning/thunderclap": fx_lightning_thunderclap,
  "lightning/zap-hit": fx_lightning_zap_hit,
  "nature/acid-splash": fx_nature_acid_splash,
  "nature/earth-spike": fx_nature_earth_spike,
  "nature/healing-bloom": fx_nature_healing_bloom,
  "nature/leaf-storm": fx_nature_leaf_storm,
  "nature/poison-cloud": fx_nature_poison_cloud,
  "nature/root-snare": fx_nature_root_snare,
  "nature/tornado": fx_nature_tornado,
  "nature/toxic-puddle": fx_nature_toxic_puddle,
  "nature/vine-whip": fx_nature_vine_whip,
  "projectiles/magic-missile": fx_projectiles_magic_missile,
  "projectiles/plasma-shot": fx_projectiles_plasma_shot,
  "scifi/emp-blast": fx_scifi_emp_blast,
  "scifi/force-field": fx_scifi_force_field,
  "shadow/black-hole": fx_shadow_black_hole,
  "shadow/curse": fx_shadow_curse,
  "shadow/dark-explosion": fx_shadow_dark_explosion,
  "shadow/eclipse": fx_shadow_eclipse,
  "shadow/grasping-hands": fx_shadow_grasping_hands,
  "shadow/hex-sigil": fx_shadow_hex_sigil,
  "shadow/life-steal": fx_shadow_life_steal,
  "shadow/necro-skulls": fx_shadow_necro_skulls,
  "shadow/shadow-flames": fx_shadow_shadow_flames,
  "shadow/shadow-tendrils": fx_shadow_shadow_tendrils,
  "shadow/soul-drain": fx_shadow_soul_drain,
  "shadow/void-orb": fx_shadow_void_orb,
  "spawn/shatter-death": fx_spawn_shatter_death,
  "spawn/soul-rise": fx_spawn_soul_rise,
  "spawn/spawn-portal": fx_spawn_spawn_portal,
  "spawn/summon-rise": fx_spawn_summon_rise,
  "status/bleeding": fx_status_bleeding,
  "status/burning": fx_status_burning,
  "status/charmed": fx_status_charmed,
  "status/confused": fx_status_confused,
  "status/cursed": fx_status_cursed,
  "status/frozen": fx_status_frozen,
  "status/haste": fx_status_haste,
  "status/petrified": fx_status_petrified,
  "status/poisoned": fx_status_poisoned,
  "status/rage": fx_status_rage,
  "status/sleep": fx_status_sleep,
  "status/slowed": fx_status_slowed,
  "status/stunned": fx_status_stunned,
  "water/bubbles": fx_water_bubbles,
  "water/splash": fx_water_splash,
  "water/water-jet": fx_water_water_jet,
  "water/water-orb": fx_water_water_orb,
  "weather/aurora": fx_weather_aurora,
  "weather/blizzard": fx_weather_blizzard,
  "weather/cherry-blossoms": fx_weather_cherry_blossoms,
  "weather/clouds": fx_weather_clouds,
  "weather/falling-leaves": fx_weather_falling_leaves,
  "weather/fireflies": fx_weather_fireflies,
  "weather/fog": fx_weather_fog,
  "weather/god-rays": fx_weather_god_rays,
  "weather/rain": fx_weather_rain,
  "weather/shooting-stars": fx_weather_shooting_stars,
  "weather/snow": fx_weather_snow,
  "weather/storm": fx_weather_storm,
};
