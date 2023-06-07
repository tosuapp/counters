/**
 * @typedef {Object} Settings
 * @property {boolean} showInterface - Indicates whether to show the interface.
 * @property {Object.<string, string>} folders - The folders configuration.
 */

/**
 * @typedef {Object} MainMenu
 * @property {number} bassDensity - The bass density.
 */

/**
 * @typedef {Object} Time
 * @property {number} firstObj - The first object time.
 * @property {number} current - The current time.
 * @property {number} full - The full time.
 * @property {number} mp3 - The mp3 time.
 */

/**
 * @typedef {Object} Metadata
 * @property {string} artist - The artist name.
 * @property {string} artistOriginal - The original artist name.
 * @property {string} title - The song title.
 * @property {string} titleOriginal - The original song title.
 * @property {string} mapper - The mapper name.
 * @property {string} difficulty - The difficulty level.
 */

/**
 * @typedef {Object} BPM
 * @property {number} min - The minimum BPM.
 * @property {number} max - The maximum BPM.
 */

/**
 * @typedef {Object} Stats
 * @property {number} AR - The approach rate.
 * @property {number} CS - The circle size.
 * @property {number} OD - The overall difficulty.
 * @property {number} HP - The health points.
 * @property {number} SR - The star rating.
 * @property {BPM} BPM - The BPM information.
 * @property {number} maxCombo - The maximum combo.
 * @property {number} fullSR - The full star rating.
 * @property {number} memoryAR - The memory AR.
 * @property {number} memoryCS - The memory CS.
 * @property {number} memoryOD - The memory OD.
 * @property {number} memoryHP - The memory HP.
 */

/**
 * @typedef {Object} Path
 * @property {string} full - The full path.
 * @property {string} folder - The folder path.
 * @property {string} file - The file path.
 * @property {string} bg - The background path.
 * @property {string} audio - The audio path.
 */

/**
 * @typedef {Object} BM
 * @property {Time} time - The time information.
 * @property {number} id - The BM ID.
 * @property {number} set - The set number.
 * @property {string} md5 - The MD5 hash.
 * @property {number} rankedStatus - The ranked status.
 * @property {Metadata} metadata - The metadata.
 * @property {Stats} stats - The stats.
 * @property {Path} path - The file paths.
 */

/**
 * @typedef {Object} Mods
 * @property {number} num - The number of mods.
 * @property {string} str - The mods string.
 */

/**
 * @typedef {Object} Strains
 * @property {string} name - The strain name.
 * @property {number[]} data - The strain data.
 */

/**
 * @typedef {Object} StrainsAll
 * @property {Strains[]} series - The strain series.
 * @property {number[]} xaxis - The x-axis data.
 */

/**
 * @typedef {Object} PP
 * @property {number} 95 - The 95% PP.
 * @property {number} 96 - The 96% PP.
 * @property {number} 97 - The 97% PP.
 * @property {number} 98 - The 98% PP.
 * @property {number} 99 - The 99% PP.
 * @property {number} 100 - The 100% PP.
 * @property {number[]} strains - The strains.
 * @property {StrainsAll} strainsAll - The strains all.
 */

/**
 * @typedef {Object} Menu
 * @property {MainMenu} mainMenu - The main menu configuration.
 * @property {number} state - The state.
 * @property {number} gameMode - The game mode.
 * @property {number} isChatEnabled - Indicates whether chat is enabled.
 * @property {BM} bm - The BM configuration.
 * @property {Mods} mods - The mods configuration.
 * @property {PP} pp - The PP configuration.
 */

/**
 * @typedef {Object} Combo
 * @property {number} current - The current combo.
 * @property {number} max - The maximum combo.
 */

/**
 * @typedef {Object} HP
 * @property {number} normal - The normal HP.
 * @property {number} smooth - The smooth HP.
 */

/**
 * @typedef {Object} Grade
 * @property {string} current - The current grade.
 * @property {string} maxThisPlay - The maximum grade achieved in the current play.
 */

/**
 * @typedef {Object} HitError
 * @property {number} 0 - The 0 hit error.
 * @property {number} 50 - The 50 hit error.
 * @property {number} 100 - The 100 hit error.
 * @property {number} 300 - The 300 hit error.
 * @property {number} geki - The geki hit error.
 * @property {number} katu - The katu hit error.
 * @property {number} sliderBreaks - The slider breaks.
 * @property {Grade} grade - The grade information.
 * @property {number} unstableRate - The unstable rate.
 * @property {number[]} hitErrorArray - The hit error array.
 */

/**
 * @typedef {Object} KeyOverlay
 * @property {Object} k1 - The k1 key overlay.
 * @property {boolean} k1.isPressed - Indicates whether the k1 key is pressed.
 * @property {number} k1.count - The count of k1 key presses.
 * @property {Object} k2 - The k2 key overlay.
 * @property {boolean} k2.isPressed - Indicates whether the k2 key is pressed.
 * @property {number} k2.count - The count of k2 key presses.
 * @property {Object} m1 - The m1 key overlay.
 * @property {boolean} m1.isPressed - Indicates whether the m1 key is pressed.
 * @property {number} m1.count - The count of m1 key presses.
 * @property {Object} m2 - The m2 key overlay.
 * @property {boolean} m2.isPressed - Indicates whether the m2 key is pressed.
 * @property {number} m2.count - The count of m2 key presses.
 */

/**
 * @typedef {Object} Slot
 * @property {string} name - The player name.
 * @property {number} score - The score.
 * @property {number} combo - The combo.
 * @property {number} maxCombo - The maximum combo.
 * @property {string} mods - The mods.
 * @property {number} h300 - The 300 hit count.
 * @property {number} h100 - The 100 hit count.
 * @property {number} h50 - The 50 hit count.
 * @property {number} h0 - The 0 hit count.
 * @property {number} team - The team number.
 * @property {number} position - The position.
 * @property {number} isPassing - Indicates whether the player is passing.
 */

/**
 * @typedef {Object} Leaderboard
 * @property {boolean} hasLeaderboard - Indicates whether the leaderboard is available.
 * @property {boolean} isVisible - Indicates whether the leaderboard is visible.
 * @property {Object} ourplayer - The information of our player.
 * @property {string} ourplayer.name - The player name.
 * @property {number} ourplayer.score - The score.
 * @property {number} ourplayer.combo - The combo.
 * @property {number} ourplayer.maxCombo - The maximum combo.
 * @property {string} ourplayer.mods - The mods.
 * @property {number} ourplayer.h300 - The 300 hit count.
 * @property {number} ourplayer.h100 - The 100 hit count.
 * @property {number} ourplayer.h50 - The 50 hit count.
 * @property {number} ourplayer.h0 - The 0 hit count.
 * @property {number} ourplayer.team - The team number.
 * @property {number} ourplayer.position - The position.
 * @property {number} ourplayer.isPassing - Indicates whether the player is passing.
 * @property {Slot[]} slots - The leaderboard slots.
 */

/**
 * @typedef {Object} Gameplay
 * @property {number} gameMode - The game mode.
 * @property {string} name - The game name.
 * @property {number} score - The score.
 * @property {number} accuracy - The accuracy.
 * @property {Combo} combo - The combo information.
 * @property {HP} hp - The HP information.
 * @property {HitError} hits - The hit error information.
 * @property {PP} pp - The PP information.
 * @property {KeyOverlay} keyOverlay - The key overlay configuration.
 * @property {Leaderboard} leaderboard - The leaderboard information.
 */

/**
 * @typedef {Object} ResultsScreen
 * @property {number} 0 - The 0 hit count.
 * @property {number} 50 - The 50 hit count.
 * @property {number} 100 - The 100 hit count.
 * @property {number} 300 - The 300 hit count.
 * @property {string} name - The player name.
 * @property {number} score - The score.
 * @property {number} maxCombo - The maximum combo.
 * @property {Mods} mods - The mods configuration.
 * @property {number} geki - The geki hit count.
 * @property {number} katu - The katu hit count.
 */

/**
 * @typedef {Object} MyObject
 * @property {Settings} settings - The settings.
 * @property {Menu} menu - The menu configuration.
 * @property {Gameplay} gameplay - The gameplay information.
 * @property {ResultsScreen} resultsScreen - The results screen information.
 */