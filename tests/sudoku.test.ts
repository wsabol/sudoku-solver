import { describe, expect, it } from "vitest";
import SudokuSolver from "../src/sudokuSolver";
import { PlacementMove } from "../src/move";
import { parseBoardString } from "../src/utils";

const BOARD =
    "000010080302607000070000003080070500004000600003050010200000050000705108060040000";

const SOLVED_BOARD =
    "974236158638591742125487936316754289742918563589362417867125394253649871491873625";

const solveAnswers = [
    {
        title: 'Easiest',
        input: '300967001040302080020000070070000090000873000500010003004705100905000207800621004',
        output: '358967421741352689629184375173546892492873516586219743264795138915438267837621954',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Unique Solution',
            difficulty: 'Diabolical',
            solutions: 1
        }
    },
    {
        title: 'Gentle',
        input: '000004028406000005100030600000301000087000140000709000002010003900000507670400000',
        output: '735164928426978315198532674249381756387256149561749832852617493914823567673495281',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Unique Solution',
            difficulty: 'Diabolical',
            solutions: 1
        }
    },
    {
        title: 'Moderate',
        input: '030007000067100350019000000500000007070203010900000008000000680086002970000700040',
        output: '235467891867129354419835726543918267678253419921674538754391682186542973392786145',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Diabolical',
            solutions: 0
        }
    },
    {
        title: 'Tough',
        input: '018050000060000049900207000700006030000308000030500007000709004450000070000020360',
        output: '318954726267831549945267183724196835596378412831542697683719254452683971179425368',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Diabolical',
            solutions: 0
        }
    },
    {
        title: 'Diabolical',
        input: '700409000000075300050100070640000010100080004090000036020004060007950000000708005',
        output: '700409000000875300050100070643097010170683004090041736020314067407950003000708005',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Diabolical',
            solutions: 0
        }
    },
    {
        title: 'Easy 17 Clue',
        input: '000041000060000200000000000320600000000050041700000000000200300048000000501000000',
        output: '872941563169573284453826197324617859986352741715498632697284315248135976531769428',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Unique Solution',
            difficulty: 'Impossible',
            solutions: 1
        }
    },
    {
        title: 'Hard 17 Clue',
        input: '002090300805000000100000000090060040000000058000000001070000200300500000000100000',
        output: '742895316835617429169234587598361742613742958427958631971483265386529174254176893',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Impossible',
            solutions: 0
        }
    },
    {
        title: 'Naked Triples',
        input: '000000000001900500560310090100600028004000700270004003040068035002005900000000000',
        output: '928547316431986572567312894195673428384251769276894153749168235612435987853729641',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Diabolical',
            solutions: 0
        }
    },
    {
        title: 'Hidden Triple',
        input: '300000000970010000600583000200000900500621003008000005000435002000090056000000001',
        output: '381976524975214638642583179264358917597621483138749265816435792423197856759862341',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Impossible',
            solutions: 0
        }
    },
    {
        title: 'Hidden Quad',
        input: '000705006000040081000030050041000008060000020500000430000070000978050000300201000',
        output: '482715396635942781197638254741523968863497125529186437216879543978354612354261879',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Impossible',
            solutions: 0
        }
    },
    {
        title: 'Intersection Removal',
        input: '000921003009000060000000500080403006007000800500700040003000000020000700800195000',
        output: '700921483009500060008000500080453076007000800500700040003000000020000700870195000',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Impossible',
            solutions: 0
        }
    },
    {
        title: 'x-wing example',
        input: '007010000000800500180009064600000003071080640400000005840600031005002000000030700',
        output: '567314928394826517182759364658247193971583642423961875849675231735192486216438759',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Diabolical',
            solutions: 0
        }
    },
    {
        title: 'Simple Colouring Rule 2',
        input: '000000060002705000500013009704500003003040100900007405600920004000301800080000000',
        output: '300000560092765300500013209714500603053040100900137405630928704009301806080000930',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Diabolical',
            solutions: 0
        }
    },
    {
        title: 'Simple Colouring Rule 4',
        input: '090010030800300009070006005080003000052000370000400080900800040600009008010050090',
        output: '590010030800305009070006005080503900052000370009400580905800040600009058018050090',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Diabolical',
            solutions: 0
        }
    },
    {
        title: 'y-wing example',
        input: '645010893738459621219638745597060184481975000326841579902080010803190000164020908',
        output: '645712893738459621219638745597263184481975362326841579952386417873194256164527938',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Medium',
            solutions: 0
        }
    },
    {
        title: 'RE',
        input: '030609020000280000100000009000000653720060091365000000200000007000016000010507040',
        output: '030609120600281000102000069001002653720365091365190000206000017000016000010527046',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Diabolical',
            solutions: 0
        }
    },
    {
        title: 'SwordFish',
        input: '050030602642895317037020800023504700406000520571962483214000900760109234300240170',
        output: '050030602642895317037020800023504700406000520571962483214000900760109234300240170',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Medium',
            solutions: 0
        }
    },
    {
        title: 'XYZ-Wing',
        input: '300000000600000048507006300080700100100603002005008060003100906790000005000000003',
        output: '308001607619037048507006301086705130174693002035018760053100906790360005060009003',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Diabolical',
            solutions: 0
        }
    },
    {
        title: 'X-Cycle (weak link)',
        input: '000000000890632004002090800070000600900005008001000030003010200600873019000000000',
        output: '000000000890632104002090800078300601930105008001000030003010200620873019009000000',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Impossible',
            solutions: 0
        }
    },
    {
        title: 'X-Cycle (strong link)',
        input: '000000020005080400400100800090002000037000560000970000004008605006040700080000000',
        output: '800400020005080400400100850098002100237814569041970000004008605056040700080000000',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Impossible',
            solutions: 0
        }
    },
    {
        title: 'X-Cycle (off-chain)',
        input: '040005800700010900003007100400700000050908040000002008009500700000020005004100090',
        output: '040095800705810904893047150408701009050908040906402008009584700000029485584170090',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Impossible',
            solutions: 0
        }
    },
    {
        title: 'XY-Chain x 16',
        input: '902060300850000060000000000170850000009207600000016050000000000030000078004090200',
        output: '902060300850000060060000000176850400509207600020016050090000000030000978004090200',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Impossible',
            solutions: 0
        }
    },
    {
        title: '3D Medusa Rule 1',
        input: '093824560085600002206075008321769845000258300578040296850016723007082650002507180',
        output: '093824560085600002206075008321769845000258300578040296850016723007082650002507180',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Medium',
            solutions: 0
        }
    },
    {
        title: '3D Medusa Rule 2',
        input: '503682140214597836680300500305200904000050001108409750000000010706100290031925000',
        output: '503682140214597836680300500305200904000050001108409750000000010706100290031925000',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Hard',
            solutions: 0
        }
    },
    {
        title: '3D Medusa Rule 3',
        input: '050020000192000004004600000000008005006941800900700000000006300300000621000080090',
        output: '650020080192800064804600000000068905506941800900700006000006308300000621060080097',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Impossible',
            solutions: 0
        }
    },
    {
        title: '3D Medusa Rule 4',
        input: '587412693206037800100008200002001748050724900714800500005240109001085400420170305',
        output: '587412693206037800100008200002001748050724900714800500005240109001085400420170305',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Hard',
            solutions: 0
        }
    },
    {
        title: '3D Medusa Rule 5',
        input: '080276049000000000200309008001000060007000800090000500900608003000000000520904000',
        output: '085276049709000020206309008001000060007000800092000500974608203000000000520904000',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Impossible',
            solutions: 0
        }
    },
    {
        title: '3D Medusa Rule 6',
        input: '900060500001000040300700008000058400060000080002040300100005009020000800007030002',
        output: '900060500201500040356704008700058400060000080002040300100005009020000834007030152',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Impossible',
            solutions: 0
        }
    },
    {
        title: 'Jelly-Fish',
        input: '400100000002000004008090100006403800080000010007906200003070000200000605000002001',
        output: '400100000002000004008094100026413800380000016007986203003071000201009605000002001',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Impossible',
            solutions: 0
        }
    },
    {
        title: 'UR type 1',
        input: '016098020020000784000000000007009500000307000005100400000000000681000050050670810',
        output: '016098325020561784508000000067009530000357000005106470000815040681900257050672810',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Diabolical',
            solutions: 0
        }
    },
    {
        title: 'UR type 2',
        input: '900082030000000040000090100700031004090000080200540306005060000070000000010450003',
        output: '900182035100075040500094100756831004090726581281549376005060010070010050010450003',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Impossible',
            solutions: 0
        }
    },
    {
        title: 'UR type 2b',
        input: '000000600300006410000480700000050100040802050002070000006729000094600007001000000',
        output: '400007600370296410000480700003954172147862050952070864006729041094600007701040006',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Impossible',
            solutions: 0
        }
    },
    {
        title: 'UR type 2c',
        input: '100020050000730200300400008005608000002000400000100700800006000001007000030010002',
        output: '100829050008731200320465008005608020002003400003102700800206030201387000030014802',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Impossible',
            solutions: 0
        }
    },
    {
        title: 'UR type 3',
        input: '070000000060020040801000300004203700200040006003806400002000807090030010000000060',
        output: '470380600360027048821000370604203780287040036903876400032000807096038214048002063',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Impossible',
            solutions: 0
        }
    },
    {
        title: 'UR type 3b',
        input: '000604001028000050000075300000020005006501900100000000005160000060000120300908000',
        output: '500684201028319050001275300000020015206531900150090032005162003060753120312948500',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Impossible',
            solutions: 0
        }
    },
    {
        title: 'UR type 4',
        input: '900500081000802500005000020030001050100040003050600090080000900006709000790008004',
        output: '900500081000802540805000020030001450100045003050600190080000900006709000790058004',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Diabolical',
            solutions: 0
        }
    },
    {
        title: 'UR type 4b',
        input: '090208001620000090800000000008027000003000400000350100000000502070000034200401060',
        output: '090208001620000090800000200008027050003000420062354180000000512170502034200401760',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Impossible',
            solutions: 0
        }
    },
    {
        title: 'UR type 5',
        input: '000030000073420060000006403387961245124080639965342817701658000050093080000004000',
        output: '000030000073420060000006403387961245124080639965342817701658000050093080000004000',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Hard',
            solutions: 0
        }
    },
    {
        title: 'SK Loop - puzzle called \'cigarette\'',
        input: '120300000340000100005000000602400500000060070000008006004200300000070009000009080',
        output: '120300000340000100005000000602400500000060070000008006004200300000070009000009080',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Impossible',
            solutions: 0
        }
    },
    {
        title: 'EUR type 1',
        input: '020310700300090000805000200000230000500000009000769000009000107000000003001053020',
        output: '020318795317592000895000231970235010562000379103769502039000157050000003701053020',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Impossible',
            solutions: 0
        }
    },
    {
        title: 'EUR type 4',
        input: '800000002020800040005007900000040800640509031002010000006900200090005060500000003',
        output: '800400002020800040405207900050040829648529731902018654006904205290005060500002093',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Diabolical',
            solutions: 0
        }
    },
    {
        title: 'HUR type 1',
        input: '002701030000503000009000580030000090408000703010000060046000100000409000090108600',
        output: '002701030104503000379000581030010090408900713910000060846000109001469308093108640',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Diabolical',
            solutions: 0
        }
    },
    {
        title: 'HUR type 2',
        input: '650040000000000200300006008060800300000020000041009060200100007003000400000070031',
        output: '658240003410080206320006048062800300035620000041009062204100607173068420506472031',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Impossible',
            solutions: 0
        }
    },
    {
        title: 'HUR type 2b',
        input: '800001060021040000000506700069000240000000000072000130003609000000020390010400006',
        output: '857201060621040080394586712169000240438002600572064130283609000746020390915400826',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Diabolical',
            solutions: 0
        }
    },
    {
        title: 'WXYZ-Wing',
        input: '000020000500400008031006090040809037000000000980203050060700480200004006000000000',
        output: '000020000500400008031506090040809037000000809980203050060700480200004006000000000',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Impossible',
            solutions: 0
        }
    },
    {
        title: 'APE',
        input: '000138000503900400700050000079002010000000000080500960000090003006003107000641000',
        output: '000138000503900400708050000079002010005009000380500960000795603056003107037641000',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Diabolical',
            solutions: 0
        }
    },
    {
        title: 'GXC	(Strong link)',
        input: '003902000070006800980000000300270005000000000600035007400000069006300070000809400',
        output: '063982700070006893980703006309278605857690000600035987408007069096300078700869400',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Impossible',
            solutions: 0
        }
    },
    {
        title: 'GXC	(Weak link)',
        input: '130060209005030000000800006000080503050000020803010000300002000000040600407050031',
        output: '138560209265030000000821356002080503050000020803215060306002005500040602427050031',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Diabolical',
            solutions: 0
        }
    },
    {
        title: 'GXC	(off chain)',
        input: '000700000620000000004052300057030028090000010130070060005490600000000032000000000',
        output: '503700200620300000004052300457030928896000713132070060205493600000000032300000000',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Impossible',
            solutions: 0
        }
    },
    {
        title: 'FSF',
        input: '050000070003060800060100300900607001000203000500409007005008040008020700010000050',
        output: '050830070003060810860100300900607001000203000500409007605008140008521760010046058',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Diabolical',
            solutions: 0
        }
    },
    {
        title: 'FSF Sashimi',
        input: '006301000190000006004090100059600040000030000060004920007050600300000015000408300',
        output: '006301000190005036034096100059610043401030560063504921907153680300060015615408300',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Diabolical',
            solutions: 0
        }
    },
    {
        title: 'AIC (Strong)',
        input: '000024090000301070400005008007000054004000300210000900800700002040109000050480000',
        output: '070824090028301470400075008007000054004000300210040900800700042042109000050482009',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Diabolical',
            solutions: 0
        }
    },
    {
        title: 'AIC (Weak)',
        input: '190000005804000000000800790000720000000904200000065000048003000002000608300000027',
        output: '197002005804097000000800790000720000000904200000065000648273000002000638300000427',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Impossible',
            solutions: 0
        }
    },
    {
        title: 'AIC (off chain)',
        input: '000000900600103005001290600000000008028040360700000000007019400500306007009000000',
        output: '000000900690103005001290600000000008028040360700000000007019400500306097009000000',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Impossible',
            solutions: 0
        }
    },
    {
        title: 'Dual CFC',
        input: '008050600940000000250300079000600000020010040000007000360008057000000016007020400',
        output: '008050604940000000250304079000600000620010740000007060360008057000000016007026400',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Impossible',
            solutions: 0
        }
    },
    {
        title: 'Sue-De-Coq',
        input: '020000050000403000906005800800020490000000000094080061007300906000102000050000030',
        output: '020800050000403000906205800800621490000934000094587061007358906000102000050700030',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Impossible',
            solutions: 0
        }
    },
    {
        title: 'CFC',
        input: '105000009000080501040000060080067000000809000000350026060000050403070000900000302',
        output: '105000089000080501040000060080067000000809000700350826060000050403070608900000302',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Impossible',
            solutions: 0
        }
    },
    {
        title: 'Nishio',
        input: '000004065007000003800310400006070000700109008000050200003068009000000800520900000',
        output: '000084065007090183800310400006070000700109608000050200003068009000000800528900006',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Impossible',
            solutions: 0
        }
    },
    {
        title: 'ALS',
        input: '600097030000020400300600007003000050500000002080000900700806001009010000010300005',
        output: '600097038000023469390600007903000050500900002080000900700806091009010000010309005',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Impossible',
            solutions: 0
        }
    },
    {
        title: 'POM',
        input: '000002000035100870800300009090015000002000600000620040900001003013006520000700000',
        output: '009582000035100870800300059090015000002000600000620040900201003013006520000700000',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Diabolical',
            solutions: 0
        }
    },
    {
        title: 'Exocet unsolvable no 218',
        input: '000000700007109000680070010001090600000300020040000003008060100500000040000002005',
        output: '000000700007109000680070010001090600000300021040000003008060100500000040000002005',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Impossible',
            solutions: 0
        }
    },
    {
        title: 'Riddle of Sho',
        input: '000000605000300090080004001040020970000000000031080060900600020010007000504000000',
        output: '003000605000300097080004231040020970000000000031080060978600020310007000504000700',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Impossible',
            solutions: 0
        }
    },
    {
        title: 'ESCARGOT',
        input: '100007090030020008009600500005300900010080002600004000300000010040000007007000300',
        output: '100007090030020008009600500005300900010080002600004000300000010041000007007000300',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Impossible',
            solutions: 0
        }
    },
    {
        title: 'Shining Mirror',
        input: '000001002003000040050060700000800070007003800900050001006080200040600007200009060',
        output: '000001002003000040050060700000800070007003800900050001006080200040600007200009060',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Impossible',
            solutions: 0
        }
    },
    {
        title: 'Easter Monster',
        input: '100000002090400050006000700050903000000070000000850040700000600030009080002000001',
        output: '100000002090400050006000700050903000000070000000850040700000600030009080002000001',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Impossible',
            solutions: 0
        }
    },
    {
        title: 'Arto Inkala',
        input: '800000000003600000070090200050007000000045700000100030001000068008500010090000400',
        output: '800000000003600000070090200050007000000045700000100030001000068008500010090000400',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Impossible',
            solutions: 0
        }
    },
    {
        title: '18 clue moderate',
        input: '400805200000000000080070000000208907000000004105300000000000010000000000001007006',
        output: '400805200000000000080070000000218957000756134175300000000000010000000000001007006',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Impossible',
            solutions: 0
        }
    },
    {
        title: '12 clue tough',
        input: '000000010000000200030000405000000000000000000000006000000070000602000080000340000',
        output: '000000010000000200030000405000000000000000000000006000000070000602000080000340000',
        describe: {
            isValid: false,
            isComplete: false,
            message: 'Board has too many empty cells, normal Sudoku must have at least 17 given values',
            difficulty: '',
            solutions: 0
        }
    },
    {
        title: 'Tough Strategies',
        input: '700020080000000900000309051000070000008450100000060000000500000000000000010080002',
        output: '791625080000817926000349751000070000008450100000060000000500000000000000010780002',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Impossible',
            solutions: 0
        }
    },
    {
        title: 'Big Hidden Quad',
        input: '000008100700090056005000700000000070080000000060000000608000400040010003001800000',
        output: '006008100700090856805000700000000070080000000060000000608000400040010083001800000',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Impossible',
            solutions: 0
        }
    },
    {
        title: 'Y-Wing / X-Wing',
        input: '209006003000020600007000200008070020700682005052031867026040900074060002100200006',
        output: '209006003000020600007000200008070020700682005052031867026040900074060002100200006',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Diabolical',
            solutions: 0
        }
    },
    {
        title: 'SwordFish',
        input: '010200050009000400000100000000467090001508600090301000000002000008000900070005040',
        output: '010200050009000400000100000000467090001598600090321000000002000008000900070005040',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Impossible',
            solutions: 0
        }
    },
    {
        title: 'Simple Colouring',
        input: '000006000070000000630010074160000008020908040400000029790000081000000060000700000',
        output: '000076000070000000630010074169000008020908140400000029790000081000000060000700000',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Impossible',
            solutions: 0
        }
    },
    {
        title: 'Y-Wing',
        input: '862719354051023700030850100200087005500001000000560003000045030024108500005000841',
        output: '862719354051023700030850100200087005500001000000560003000045030024108500005000841',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Diabolical',
            solutions: 0
        }
    },
    {
        title: 'Jelly-Fish',
        input: '500060002002000300000054006020000047000506000850000030000340000004000200900020004',
        output: '500063402002000300000254006020000547000506020850402630200340000004000203900020004',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Impossible',
            solutions: 0
        }
    },
    {
        title: 'X-Cycle on 7',
        input: '000090050890502030400080070009600003000000000600008500070060005060205047010040000',
        output: '000090050890502030400080070009600003000000000600008500074060005060205047010040000',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Diabolical',
            solutions: 0
        }
    },
    {
        title: 'UR 1',
        input: '000300796376190840490000310600020000000613000000080601130000084504031967067000103',
        output: '000300796376190840490000310600020000000613000000080601130000084504031967067000103',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Diabolical',
            solutions: 0
        }
    },
    {
        title: 'UR 4',
        input: '009000000312890700800000002000980000700040009000052000900000005005019267000000100',
        output: '009000000312890700800000902000980000700040009090052000901000005485319267000000190',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Impossible',
            solutions: 0
        }
    },
    {
        title: 'XYZ-Wings',
        input: '625371849834060712791080356350020000400153008100090035047010003083040000216030504',
        output: '625371849834060712791080356350020000400153008100090035047010003083040000216030504',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Hard',
            solutions: 0
        }
    },
    {
        title: 'APE',
        input: '000106025102705006560802000009520008280960000306481209600208004920614507840309002',
        output: '008106025102705806560802000009520008280960000306481209600208004923614587840309002',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Hard',
            solutions: 0
        }
    },
    {
        title: 'Finned X-Wing',
        input: '000002040803000010009010020700030000005000000000060003050040600040000105000900000',
        output: '500002040823000010409010020700030000005000000000060003050040600040000105000900000',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Impossible',
            solutions: 0
        }
    },
    {
        title: 'Extreme Extreme',
        input: '000000400020310000000000001700023090002090800030450006000000000060082050009000000',
        output: '000000400020310000000000001700023090002090800930450006000000000060082050009000000',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Impossible',
            solutions: 0
        }
    },
    {
        title: 'Unsolveable',
        input: '000378000000104000000000000930000054100030002420000013000000000000801000000596000',
        output: '000378000000104000000000000930010054100430002420080013000703000000801000000596000',
        describe: {
            isValid: true,
            isComplete: false,
            message: 'Invalid Puzzle ("no unique solution")',
            difficulty: 'Impossible',
            solutions: 0
        }
    }
];

describe("parseBoardString", () => {
    it("parses an 81-character string to a 9x9 board", () => {
        const board = parseBoardString(BOARD);
        expect(board).toHaveLength(9);
        expect(board.every((row) => row.length === 9)).toBe(true);
    });

    it("treats '.' as 0", () => {
        const board = parseBoardString("." + "0".repeat(80));
        expect(board[0][0]).toBe(0);
    });

    it("throws for a string shorter than 81 characters", () => {
        expect(() => parseBoardString("123")).toThrow();
    });

    it("throws for an invalid character", () => {
        expect(() => parseBoardString("x" + "0".repeat(80))).toThrow();
    });
});

describe("SudokuSolver", () => {
    describe("constructor", () => {
        it("accepts a string input", () => {
            expect(() => new SudokuSolver(BOARD)).not.toThrow();
        });

        it("accepts a Board matrix input", () => {
            const board = parseBoardString(BOARD);
            expect(() => new SudokuSolver(board)).not.toThrow();
        });

        it("throws for invalid matrix shape", () => {
            expect(() =>
                new SudokuSolver([[1, 2, 3]] as unknown as number[][])
            ).toThrow("Board must be a 9x9 matrix");
        });
    });

    describe("validate()", () => {
        it("returns valid for a correct board", () => {
            const s = new SudokuSolver(BOARD);
            const result = s.validate();
            expect(result.isValid).toBe(true);
            expect(result.reasons).toHaveLength(0);
            expect(result.message).toBe("Valid");
        });

        it("flags invalid_value", () => {
            const board = parseBoardString(BOARD);
            board[0][0] = 12;
            const s = new SudokuSolver(board);
            const result = s.validate();
            expect(result.isValid).toBe(false);
            expect(result.reasons.some((r) => r.type === "invalid_value")).toBe(true);
        });

        it("flags duplicate_in_row", () => {
            // Row 0 of BOARD has a 1 at col 4; placing 1 at col 0 creates a row duplicate
            const board = parseBoardString(BOARD);
            board[0][0] = 1;
            const s = new SudokuSolver(board);
            const result = s.validate();
            expect(result.isValid).toBe(false);
            expect(result.reasons.some((r) => r.type === "duplicate_in_row")).toBe(true);
        });

        it("flags duplicate_in_column", () => {
            // Place 5 in two cells of the same column but different boxes
            // row 0 col 0 = 5, row 3 col 0 = 5 → duplicate in col 0
            const board = parseBoardString("500000000000000000000000000500000000000000000000000000000000000000000000000000000");
            const s = new SudokuSolver(board);
            const result = s.validate();
            expect(result.isValid).toBe(false);
            expect(result.reasons.some((r) => r.type === "duplicate_in_column")).toBe(true);
        });

        it("flags duplicate_in_box", () => {
            // row 0 col 0 = 9, row 1 col 1 = 9 → same box, different rows and cols
            const board = parseBoardString("900000000090000000000000000000000000000000000000000000000000000000000000000000000");
            const s = new SudokuSolver(board);
            const result = s.validate();
            expect(result.isValid).toBe(false);
            expect(result.reasons.some((r) => r.type === "duplicate_in_box")).toBe(true);
        });

        it("flags too_many_empty_cells for a board with fewer than 17 givens", () => {
            // 12-clue board: 69 empty cells
            const sparse = "000000010000000200030000405000000000000000000000006000000070000602000080000340000";
            const s = new SudokuSolver(sparse);
            const result = s.validate();
            expect(result.isValid).toBe(false);
            expect(result.reasons.some((r) => r.type === "too_many_empty_cells")).toBe(true);
        });

        it("flags empty_cell_no_candidates for an unsolvable board", () => {
            const unsolvable =
                "..9.287..8.6..4..5..3.....46.........2.71345.........23.....5..9..4..8.7..125.3..";
            const s = new SudokuSolver(unsolvable);
            const result = s.validate();
            expect(result.isValid).toBe(false);
            expect(result.reasons.some((r) => r.type === "empty_cell_no_candidates")).toBe(true);
        });

        it("does not emit empty_cell_no_candidates when board has duplicates", () => {
            const invalidBoard =
                "110010080302607000070000003080070500004000600003050010200000050000705108060040000";
            const s = new SudokuSolver(invalidBoard);
            const result = s.validate();
            expect(result.isValid).toBe(false);
            expect(result.reasons.every((r) => r.type !== "empty_cell_no_candidates")).toBe(true);
        });
    });

    describe("isComplete() / countEmptyCells()", () => {
        it("isComplete returns false for an unsolved board", () => {
            const s = new SudokuSolver(BOARD);
            expect(s.isComplete()).toBe(false);
        });

        it("isComplete returns true for a fully solved board", () => {
            const s = new SudokuSolver(SOLVED_BOARD);
            expect(s.isComplete()).toBe(true);
        });

        it("countEmptyCells returns 0 for a solved board", () => {
            const s = new SudokuSolver(SOLVED_BOARD);
            expect(s.countEmptyCells()).toBe(0);
        });

        it("countEmptyCells counts zeros in the board", () => {
            const s = new SudokuSolver(BOARD);
            const expected = parseBoardString(BOARD).flat().filter((v) => v === 0).length;
            expect(s.countEmptyCells()).toBe(expected);
        });
    });

    describe("difficulty()", () => {
        // Replace the first N characters of SOLVED_BOARD with '0' to get N empty cells.
        // Since SOLVED_BOARD has no zeros, this gives exactly N empty cells.
        const withNEmpties = (n: number): string =>
            "0".repeat(n) + SOLVED_BOARD.slice(n);

        it.each([
            { n: 0, expected: "Easy" },
            { n: 17, expected: "Easy" },
            { n: 18, expected: "Medium" },
            { n: 31, expected: "Hard" },
            { n: 41, expected: "Diabolical" },
            { n: 56, expected: "Impossible" },
        ])("returns $expected for $n empty cells", ({ n, expected }) => {
            const s = new SudokuSolver(withNEmpties(n));
            expect(s.difficulty()).toBe(expected);
        });
    });

    describe("getPossibles() / setSquareValue()", () => {
        it("getPossibles returns [] for a filled cell", () => {
            const s = new SudokuSolver(SOLVED_BOARD);
            expect(s.getPossibles(0, 0)).toEqual([]);
        });

        it("getPossibles returns valid candidates for an empty cell", () => {
            const s = new SudokuSolver(BOARD);
            const board = parseBoardString(BOARD);
            let emptyRow = 0;
            let emptyCol = 0;
            outer: for (let r = 0; r < 9; r++) {
                for (let c = 0; c < 9; c++) {
                    if (board[r][c] === 0) {
                        emptyRow = r;
                        emptyCol = c;
                        break outer;
                    }
                }
            }
            const possibles = s.getPossibles(emptyRow, emptyCol);
            expect(possibles.length).toBeGreaterThan(0);
            expect(possibles.every((v) => v >= 1 && v <= 9)).toBe(true);
        });

        it("setSquareValue places a value and removes candidates from peers", () => {
            const s = new SudokuSolver(BOARD);
            const move = s.getNextMove();
            expect(move).not.toBeNull();
            expect(move!.type).toBe("placement");
            const placement = move as PlacementMove;
            s.setSquareValue(placement.row, placement.col, placement.value);
            expect(s.toArray()[placement.row][placement.col]).toBe(placement.value);
            expect(s.getPossibles(placement.row, placement.col)).toEqual([]);
        });

        it("setSquareValue preserves prior candidate eliminations", () => {
            const s = new SudokuSolver(BOARD);
            // Manually eliminate a candidate from a specific empty cell
            const board = s.toArray();
            let targetRow = -1, targetCol = -1;
            outer: for (let r = 0; r < 9; r++) {
                for (let c = 0; c < 9; c++) {
                    if (board[r][c] === 0 && s.getPossibles(r, c).length > 1) {
                        targetRow = r;
                        targetCol = c;
                        break outer;
                    }
                }
            }
            expect(targetRow).toBeGreaterThanOrEqual(0);
            const originalPossibles = s.getPossibles(targetRow, targetCol);
            const candidateToRemove = originalPossibles[0];
            // Simulate what applyElimination does
            const eliminationMove = {
                type: "elimination" as const,
                eliminations: [{ row: targetRow, col: targetCol, value: candidateToRemove }],
                algorithm: "Pointing Pair" as const,
                message: `Eliminate ${candidateToRemove} from 1 cell in row ${targetRow + 1} (Pointing Pair)`,
                reasoning: "Synthetic elimination for unit test.",
            };
            s.applyElimination(eliminationMove);
            expect(s.getPossibles(targetRow, targetCol)).not.toContain(candidateToRemove);

            // Now place a value elsewhere and verify the elimination is preserved
            const nextMove = s.getNextMove();
            expect(nextMove).not.toBeNull();
            if (nextMove !== null && nextMove.type === "placement" && (nextMove.row !== targetRow || nextMove.col !== targetCol)) {
                s.setSquareValue(nextMove.row, nextMove.col, nextMove.value);
                expect(s.getPossibles(targetRow, targetCol)).not.toContain(candidateToRemove);
            }
        });
    });

    describe("getNextMove()", () => {
        it("returns a move for an in-progress puzzle", () => {
            const s = new SudokuSolver(BOARD);
            const move = s.getNextMove();
            expect(move).not.toBeNull();
            expect(move!.type).toBe("placement");
            if (move !== null && move.type === "placement") {
                expect(move.row).toBeGreaterThanOrEqual(0);
                expect(move.col).toBeGreaterThanOrEqual(0);
                expect(move.value).toBeGreaterThanOrEqual(1);
            }
        });

        it("includes algorithm on every returned move", () => {
            const s = new SudokuSolver(BOARD);
            const move = s.getNextMove();
            expect(move).not.toBeNull();
            expect(move!.algorithm).toBeTruthy();
        });

        it("returns algorithm Naked Single or Full House when a cell has exactly one candidate", () => {
            // All cells filled except one — that cell must be a naked single
            const almostSolved = parseBoardString(SOLVED_BOARD);
            almostSolved[0][0] = 0;
            const s = new SudokuSolver(almostSolved);
            const move = s.getNextMove();
            expect(move).not.toBeNull();
            expect(move!.algorithm).toMatch(/^(Naked Single|Full House)$/);
        });

        it("returns algorithm Last Digit when eight copies of the value are placed and the cell is a naked single (not full house)", () => {
            // Derived from SOLVED_BOARD: four empties so row/col/box each still have ≥2 empties,
            // but digit 9 already appears eight times — only (0,0) can be 9.
            const board = parseBoardString(SOLVED_BOARD);
            board[0][0] = 0;
            board[0][8] = 0;
            board[8][0] = 0;
            board[1][1] = 0;
            const s = new SudokuSolver(board);
            const move = s.getNextMove();
            expect(move).not.toBeNull();
            expect(move!.type).toBe("placement");
            if (move !== null && move.type === "placement") {
                expect(move.algorithm).toBe("Last Digit");
                expect(move).toMatchObject({ row: 0, col: 0, value: 9 });
            }
        });

        it("returns algorithm Hidden Single once all naked singles are exhausted", () => {
            const s = new SudokuSolver(BOARD);
            // Drain all naked singles first
            let move = s.getNextMove();
            while (move && move.type === "placement" && move.algorithm === "Naked Single") {
                s.setSquareValue(move.row, move.col, move.value);
                move = s.getNextMove();
            }
            // BOARD requires hidden singles to progress beyond naked singles
            expect(move).not.toBeNull();
            expect(move!.algorithm).toBe("Hidden Single");
        });

        it("returns null for a complete board", () => {
            const s = new SudokuSolver(SOLVED_BOARD);
            expect(s.getNextMove()).toBeNull();
        });

        it("returns null for an invalid board", () => {
            const invalid =
                "110010080302607000070000003080070500004000600003050010200000050000705108060040000";
            const s = new SudokuSolver(invalid);
            expect(s.getNextMove()).toBeNull();
        });
    });

    describe("findPointingPairTriple()", () => {
        // After placements are exhausted, the next move is a box-line elimination (pointing).
        // Here digit 9 appears as a candidate in three cells of one box along the same row → Pointing Triple.
        const POINTING_PAIR_BOARD =
            "000030086000020000080960301070083000000000000000610020304079010000050000690040000";

        it("finds a Pointing Triple elimination move when placement algorithms are exhausted", () => {
            const s = new SudokuSolver(POINTING_PAIR_BOARD);
            // Drain all placement moves first
            let move = s.getNextMove();
            while (move && move.type === "placement") {
                s.setSquareValue(move.row, move.col, move.value);
                move = s.getNextMove();
            }
            expect(move).not.toBeNull();
            expect(move!.type).toBe("elimination");
            expect(move!.algorithm).toBe("Pointing Triple");
            if (move !== null && move.type === "elimination") {
                expect(move.eliminations.length).toBeGreaterThan(0);
                for (const e of move.eliminations) {
                    expect(e.row).toBeGreaterThanOrEqual(0);
                    expect(e.col).toBeGreaterThanOrEqual(0);
                    expect(e.value).toBeGreaterThanOrEqual(1);
                    expect(e.value).toBeLessThanOrEqual(9);
                }
            }
        });

        it("applyElimination removes the specified candidates from possiblesGrid", () => {
            const s = new SudokuSolver(POINTING_PAIR_BOARD);
            let move = s.getNextMove();
            while (move && move.type === "placement") {
                s.setSquareValue(move.row, move.col, move.value);
                move = s.getNextMove();
            }
            expect(move).not.toBeNull();
            expect(move!.type).toBe("elimination");
            if (move !== null && move.type === "elimination") {
                s.applyElimination(move);
                for (const { row, col, value } of move.eliminations) {
                    expect(s.getPossibles(row, col)).not.toContain(value);
                }
            }
        });

        it("solve() makes progress after pointing eliminations", () => {
            const s = new SudokuSolver(POINTING_PAIR_BOARD);
            const initialEmpty = s.countEmptyCells();
            s.solve();
            expect(s.countEmptyCells()).toBeLessThan(initialEmpty);
        });
    });

    describe("findXWing()", () => {
        const NAKED_TRIPLES_FIXTURE =
            "000000000001900500560310090100600028004000700270004003040068035002005900000000000";
        const DIABOLICAL_INPUT =
            "700409000000075300050100070640000010100080004090000036020004060007950000000708005";

        it("finds a row-based X-Wing elimination on the transposed Diabolical fixture", () => {
            // Transposing the Diabolical puzzle converts its column-based X-Wing into a row-based one.
            const rows = DIABOLICAL_INPUT.match(/.{9}/g)!.map((line) => line.split("").map(Number));
            let transposed = "";
            for (let c = 0; c < 9; c++) {
                for (let r = 0; r < 9; r++) {
                    transposed += String(rows[r]![c]);
                }
            }
            const s = new SudokuSolver(transposed);
            let saw = false;
            for (let i = 0; i < 50; i++) {
                const m = s.getNextMove();
                if (!m) break;
                if (
                    m.type === "elimination" &&
                    m.algorithm === "X-Wing" &&
                    m.reasoning.includes("rows ") &&
                    m.reasoning.includes(" only in columns ")
                ) {
                    expect(m.eliminations.length).toBeGreaterThan(0);
                    expect(m.reasoning).toMatch(/X-Wing on \d+: rows \d+ and \d+ have \d+ only in columns/);
                    expect(m.reasoning).toContain("cannot appear elsewhere in those columns");
                    saw = true;
                    break;
                }
                if (m.type === "placement") {
                    s.setSquareValue(m.row, m.col, m.value);
                } else {
                    s.applyElimination(m);
                }
            }
            expect(saw).toBe(true);
        });

        it("finds a column-based X-Wing on the Diabolical fixture solve path", () => {
            const s = new SudokuSolver(DIABOLICAL_INPUT);
            let saw = false;
            for (let i = 0; i < 50; i++) {
                const m = s.getNextMove();
                if (!m) break;
                if (
                    m.type === "elimination" &&
                    m.algorithm === "X-Wing" &&
                    m.reasoning.includes("columns ") &&
                    m.reasoning.includes(" only in rows ")
                ) {
                    expect(m.eliminations.length).toBeGreaterThan(0);
                    expect(m.reasoning).toContain("cannot appear elsewhere in those rows");
                    saw = true;
                    break;
                }
                if (m.type === "placement") {
                    s.setSquareValue(m.row, m.col, m.value);
                } else {
                    s.applyElimination(m);
                }
            }
            expect(saw).toBe(true);
        });
    });

    describe("findSwordfish()", () => {
        // Sudopedia Swordfish practice puzzle — requires a row-based Swordfish.
        const SWORDFISH_ROW_INPUT =
            "000308002000040700001970080905003006037000520800500903070096100006030000400807000";

        it("finds a row-based Swordfish elimination on the Sudopedia practice puzzle", () => {
            const s = new SudokuSolver(SWORDFISH_ROW_INPUT);
            let saw = false;
            for (let i = 0; i < 100; i++) {
                const m = s.getNextMove();
                if (!m) break;
                if (m.type === "elimination" && m.algorithm === "Swordfish") {
                    expect(m.eliminations.length).toBeGreaterThan(0);
                    expect(m.reasoning).toMatch(
                        /Swordfish on \d+: rows \d+, \d+ and \d+ have \d+ only in columns \d+, \d+ and \d+/,
                    );
                    expect(m.reasoning).toContain("cannot appear elsewhere in those columns");
                    saw = true;
                    break;
                }
                if (m.type === "placement") {
                    s.setSquareValue(m.row, m.col, m.value);
                } else {
                    s.applyElimination(m);
                }
            }
            expect(saw).toBe(true);
        });

        it("finds a column-based Swordfish elimination on one of the Sudopedia practice puzzles", () => {
            // Try all Sudopedia Swordfish practice puzzles; at least one must produce a column-based Swordfish.
            const puzzles = [
                SWORDFISH_ROW_INPUT,
                "000000000008206900109804206004602500700000008001307400603405709005903800000000000",
                "800060000000007600025900010008604000400000006000108300010006790002400000000090004",
                "003105400000070000604903705501000302070030050802000907107306204000010000006207500",
                "260907043730000089000000000100306005000070000400502001000000000340000097920403016",
            ];
            let saw = false;
            outer: for (const puzzle of puzzles) {
                const s = new SudokuSolver(puzzle);
                for (let i = 0; i < 100; i++) {
                    const m = s.getNextMove();
                    if (!m) break;
                    if (
                        m.type === "elimination" &&
                        m.algorithm === "Swordfish" &&
                        m.reasoning.includes("columns ") &&
                        m.reasoning.includes(" only in rows ")
                    ) {
                        expect(m.eliminations.length).toBeGreaterThan(0);
                        expect(m.reasoning).toMatch(
                            /Swordfish on \d+: columns \d+, \d+ and \d+ have \d+ only in rows \d+, \d+ and \d+/,
                        );
                        expect(m.reasoning).toContain("cannot appear elsewhere in those rows");
                        saw = true;
                        break outer;
                    }
                    if (m.type === "placement") {
                        s.setSquareValue(m.row, m.col, m.value);
                    } else {
                        s.applyElimination(m);
                    }
                }
            }
            expect(saw).toBe(true);
        });
    });

    describe("findXYWing()", () => {
        // SudokuWiki Y-Wing exemplar — requires an XY-Wing to make progress.
        const YWING_FIXTURE =
            "862719354051023700030850100200087005500001000000560003000045030024108500005000841";

        it("finds an XY-Wing elimination on the Y-Wing fixture solve path", () => {
            const s = new SudokuSolver(YWING_FIXTURE);
            let saw = false;
            for (let i = 0; i < 200; i++) {
                const m = s.getNextMove();
                if (!m) break;
                if (m.type === "elimination" && m.algorithm === "XY-Wing") {
                    expect(m.eliminations.length).toBeGreaterThan(0);
                    expect(m.reasoning).toMatch(
                        /XY-Wing: pivot r\dc\d \(\d\/\d\) links pincers r\dc\d \(\d\/\d\) and r\dc\d \(\d\/\d\)/,
                    );
                    expect(m.reasoning).toContain("cannot appear in any cell seen by both");
                    saw = true;
                    break;
                }
                s.applyMove(m);
            }
            expect(saw).toBe(true);
        });

        it("returns an elimination move (not placement) with non-empty eliminations array", () => {
            const s = new SudokuSolver(YWING_FIXTURE);
            let move = s.getNextMove();
            while (move !== null && !(move.type === "elimination" && move.algorithm === "XY-Wing")) {
                s.applyMove(move);
                move = s.getNextMove();
            }
            expect(move).not.toBeNull();
            if (move !== null && move.type === "elimination") {
                expect(move.algorithm).toBe("XY-Wing");
                expect(move.eliminations.length).toBeGreaterThan(0);
                expect(move.message).toBe(move.message); // message is set
                expect(move.message).toContain("XY-Wing");
                expect(move.reasoning.length).toBeGreaterThan(0);
            }
        });
    });

    describe("Naked subset (Pair / Triple)", () => {
        const NAKED_TRIPLES_FIXTURE =
            "000000000001900500560310090100600028004000700270004003040068035002005900000000000";

        it("finds Naked Pair elimination after placements and Pointing on the Naked Triples fixture", () => {
            const s = new SudokuSolver(NAKED_TRIPLES_FIXTURE);
            let move = s.getNextMove();
            while (move && move.type === "placement") {
                s.setSquareValue(move.row, move.col, move.value);
                move = s.getNextMove();
            }
            expect(move?.type).toBe("elimination");
            expect(move?.algorithm).toBe("Pointing Pair");
            if (move !== null && move.type === "elimination") {
                s.applyElimination(move);
            }
            move = s.getNextMove();
            expect(move?.type).toBe("elimination");
            while (move !== null && move.type === "elimination" && move.algorithm === "X-Wing") {
                s.applyElimination(move);
                move = s.getNextMove();
            }
            expect(move?.algorithm).toBe("Naked Pair");
        });

        it("finds Naked Triple elimination while solving the Naked Triples fixture", () => {
            const s = new SudokuSolver(NAKED_TRIPLES_FIXTURE);
            let saw = false;
            for (let i = 0; i < 300; i++) {
                const m = s.getNextMove();
                if (!m) break;
                if (m.type === "elimination" && m.algorithm === "Naked Triple") {
                    expect(m.eliminations.length).toBeGreaterThan(0);
                    saw = true;
                    break;
                }
                if (m.type === "placement") {
                    s.setSquareValue(m.row, m.col, m.value);
                } else {
                    s.applyElimination(m);
                }
            }
            expect(saw).toBe(true);
        });
    });

    describe("Hidden subset (Pair / Triple)", () => {
        const SIMPLE_COLOURING_RULE_4 =
            "090010030800300009070006005080003000052000370000400080900800040600009008010050090";

        it("finds Hidden Pair elimination on the Simple Colouring Rule 4 fixture solve path", () => {
            const s = new SudokuSolver(SIMPLE_COLOURING_RULE_4);
            let saw = false;
            for (let i = 0; i < 200; i++) {
                const m = s.getNextMove();
                if (!m) break;
                if (m.type === "elimination" && m.algorithm === "Hidden Pair") {
                    expect(m.eliminations.length).toBeGreaterThan(0);
                    expect(m.reasoning).toMatch(/Hidden Pair \d+\/\d+ in column \d+/);
                    expect(m.reasoning).toMatch(/appear only in r\d+c\d+, r\d+c\d+/);
                    expect(m.reasoning).toContain("candidates other than");
                    saw = true;
                    break;
                }
                if (m.type === "placement") {
                    s.setSquareValue(m.row, m.col, m.value);
                } else {
                    s.applyElimination(m);
                }
            }
            expect(saw).toBe(true);
        });
    });

    describe("Naked and Hidden quads (NakedHiddenQuads phase: naked quad, then hidden quad, per house)", () => {
        const HIDDEN_QUAD_FIXTURE =
            "000705006000040081000030050041000008060000020500000430000070000978050000300201000";
        // Puzzle that requires a Naked Quad (column-based) early in the solve path.
        const NAKED_QUAD_FIXTURE =
            "000200600407000000500407000000040007004000200900030000000601008000000401006008000";

        it("finds Naked Quad elimination on the Naked Quad fixture solve path", () => {
            const s = new SudokuSolver(NAKED_QUAD_FIXTURE);
            let saw = false;
            for (let i = 0; i < 400; i++) {
                const m = s.getNextMove();
                if (!m) break;
                if (m.type === "elimination" && m.algorithm === "Naked Quad") {
                    expect(m.eliminations.length).toBeGreaterThan(0);
                    saw = true;
                    break;
                }
                if (m.type === "placement") {
                    s.setSquareValue(m.row, m.col, m.value);
                } else {
                    s.applyElimination(m);
                }
            }
            expect(saw).toBe(true);
        });

        it("finds Hidden Quad elimination on the Hidden Quad fixture solve path", () => {
            const s = new SudokuSolver(HIDDEN_QUAD_FIXTURE);
            let saw = false;
            for (let i = 0; i < 400; i++) {
                const m = s.getNextMove();
                if (!m) break;
                if (m.type === "elimination" && m.algorithm === "Hidden Quad") {
                    expect(m.eliminations.length).toBeGreaterThan(0);
                    expect(m.reasoning).toMatch(/Hidden Quad [\d\/]+ in box \d+/);
                    expect(m.reasoning).toContain("appear only in");
                    expect(m.reasoning).toContain("candidates other than");
                    saw = true;
                    break;
                }
                if (m.type === "placement") {
                    s.setSquareValue(m.row, m.col, m.value);
                } else {
                    s.applyElimination(m);
                }
            }
            expect(saw).toBe(true);
        });
    });

    describe("solve()", () => {
        it("solves a known puzzle and leaves no empty cells", () => {
            const s = new SudokuSolver(BOARD);
            const success = s.solve();
            expect(success).toBe(true);
            expect(s.toArray().flat().includes(0)).toBe(false);
        });

        it("returns false for an invalid board and leaves the board unchanged", () => {
            const invalid =
                "110010080302607000070000003080070500004000600003050010200000050000705108060040000";
            const s = new SudokuSolver(invalid);
            expect(s.solve()).toBe(false);
        });

        it.each(solveAnswers)(
            'matches expected board state for "$title"',
            ({ input, output: expected }) => {
                const s = new SudokuSolver(input);
                const success = s.solve();
                expect(s.toArray().flat().join("")).toBe(expected);
                expect(!expected.includes("0")).toBe(success);
            }
        );
    });
});
