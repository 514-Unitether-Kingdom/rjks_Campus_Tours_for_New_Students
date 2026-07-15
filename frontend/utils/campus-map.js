// 剧情地图配置。坐标以 map1.png 的原始像素（2048 × 1489）记录，避免和页面尺寸耦合。
// 更换底图时，只需新增一个地图版本并重新填写本文件中的 points，不改剧情页面逻辑。
const CAMPUS_MAP = {
  id: 'pingyuan-campus-map1',
  image: '/images/map1.png',
  width: 2048,
  height: 1489,
  locations: [
    { id: 'no1_teaching_building', name: '第一教学楼', aliases: ['一教'], points: [[455, 304], [667, 304], [667, 380], [455, 380]] },
    { id: 'no2_teaching_building', name: '第二教学楼', aliases: ['二教'], points: [[463, 404], [503, 404], [503, 500], [463, 500]] },
    { id: 'no3_teaching_building', name: '第三教学楼', aliases: ['三教'], points: [[712, 724], [936, 724], [936, 790], [712, 790]] },
    { id: 'no4_teaching_building', name: '第四教学楼', aliases: ['四教'], points: [[1070, 740], [1240, 740], [1240, 934], [1070, 934]] },
    { id: 'material_building', name: '材料楼', aliases: ['材料科学楼'], points: [[470, 527], [663, 527], [663, 628], [470, 628]] },
    { id: 'information_building', name: '信息楼', aliases: ['信息技术楼'], points: [[405, 730], [510, 730], [510, 918], [405, 918]] },
    { id: 'information_building_east', name: '信息楼东', aliases: ['信息楼东侧小楼'], points: [[488, 790], [515, 790], [515, 866], [488, 866]] },
    { id: 'mechanical_electrical_building', name: '机电楼', aliases: ['机械楼'], points: [[208, 270], [336, 270], [336, 412], [208, 412]] },
    { id: 'intelligent_research_building', name: '智研楼', aliases: ['智妍楼'], points: [[385, 115], [420, 115], [420, 278], [385, 278]] },
    { id: 'green_building', name: '绿建楼', aliases: ['绿色建筑科技中心', '绿建中心'], points: [[818, 282], [946, 282], [946, 350], [818, 350]] },
    { id: 'energy_building', name: '能源楼', aliases: ['能源研究所'], points: [[680, 310], [848, 310], [848, 380], [680, 380]] },
    // 暖通楼位于北体育场东侧；交通楼在其南侧的相邻建筑，二者保持独立可高亮区域。
    { id: 'heating_ventilation_building', name: '暖通楼', aliases: ['暖通'], points: [[1200, 500], [1334, 500], [1334, 532], [1200, 532]] },
    { id: 'construction_building', name: '建工楼', aliases: ['建筑工程楼'], points: [[186, 516], [339, 516], [339, 640], [186, 640]] },
    { id: 'urban_construction_building', name: '城建楼', aliases: ['城市建设楼'], points: [[1635, 1165], [1768, 1165], [1768, 1222], [1635, 1222]] },
    { id: 'practice_training_building', name: '实训楼', aliases: ['实习楼', '实践训练楼'], points: [[1629, 1235], [1775, 1235], [1775, 1295], [1629, 1295]] },
    { id: 'transportation_building', name: '交通楼', aliases: ['交通运输楼'], points: [[1200, 540], [1362, 540], [1362, 580], [1200, 580]] },
    { id: 'environment_energy_building', name: '环能楼', aliases: ['环境楼', '环境与能源工程楼'], points: [[1432, 899], [1575, 899], [1575, 972], [1432, 972]] },
    { id: 'life_science_building', name: '生命楼', aliases: ['生命科学楼'], points: [[1432, 790], [1572, 790], [1572, 867], [1432, 867]] },
    { id: 'physical_science_building', name: '数理楼', aliases: ['理科楼', '物理科学楼'], points: [[1239, 742], [1367, 742], [1367, 806], [1239, 806]] },
    { id: 'science_building', name: '科学楼', aliases: ['科学技术楼'], points: [[582, 1066], [706, 1066], [706, 1165], [582, 1165]] },
    { id: 'humanities_building', name: '人文楼', aliases: ['人文馆'], points: [[809, 1267], [1002, 1267], [1002, 1360], [809, 1360]] },
    { id: 'economics_management_building', name: '经管楼', aliases: ['经济管理楼'], points: [[450, 1060], [554, 1060], [554, 1140], [450, 1140]] },
    { id: 'art_building', name: '艺术楼', aliases: ['艺术科技楼'], points: [[1302, 850], [1391, 850], [1391, 932], [1302, 932]] },
    { id: 'software_building', name: '软件楼', aliases: ['软件工程楼'], points: [[1639, 1087], [1760, 1087], [1760, 1147], [1639, 1147]] },
    { id: 'library', name: '图书馆', aliases: ['逸夫图书馆', '旧图书馆'], points: [[512, 725], [647, 725], [647, 918], [512, 918]] },
    { id: 'auditorium', name: '礼堂', aliases: ['大礼堂'], points: [[810, 401], [897, 401], [897, 488], [810, 488]] },
    { id: 'north_sports_ground', name: '北体育场', aliases: ['北田径场'], points: [[951, 367], [1158, 367], [1158, 641], [951, 641]] },
    { id: 'south_sports_ground', name: '南体育场', aliases: ['南田径场'], points: [[1040, 785], [1230, 785], [1230, 1001], [1040, 1001]] },
    { id: 'goldworking_building', name: '金工楼', aliases: ['金属工艺楼'], points: [[1000, 116], [1155, 116], [1155, 250], [1000, 250]] },
    { id: 'zhixin_garden', name: '知新园', aliases: ['知新'], points: [[768, 804], [910, 804], [910, 890], [768, 890]] },
    { id: 'swimming_pool', name: '游泳馆', aliases: ['游泳池'], points: [[862, 521], [940, 521], [940, 594], [862, 594]] },
    // 快递站位于北体育场与游泳馆之间的黄色纵向建筑下方绿色空地，按实际取件点划定小区域。
    { id: 'express_station', name: '快递站', aliases: ['快递服务点', '校园快递'], points: [[923, 614], [965, 614], [965, 652], [923, 652]] },
    { id: 'school_hospital', name: '校医院', aliases: ['北工大校医院'], points: [[971, 116], [1042, 116], [1042, 184], [971, 184]] },
    { id: 'table_tennis_hall', name: '乒乓球馆', aliases: ['乒乓球'], points: [[1003, 805], [1042, 805], [1042, 967], [1016, 987], [1003, 967]] },
    { id: 'olympic_venue', name: '奥运场馆', aliases: ['奥运餐厅', '奥运广场'], points: [[1031, 1160], [1322, 1160], [1322, 1350], [1031, 1350]] },
    { id: 'olympic_restaurant', name: '奥运餐厅', aliases: ['南区食堂'], points: [[905, 972], [1010, 972], [1010, 1062], [905, 1062]] },
    { id: 'food_court', name: '美食园', aliases: ['餐饮综合楼', '特色餐厅', '咖啡1727'], points: [[806, 958], [900, 958], [900, 1058], [806, 1058]] },
    { id: 'basketball_volleyball_courts', name: '篮球场、排球场', aliases: ['篮球场', '排球场'], points: [[1024, 1080], [1198, 1080], [1198, 1160], [1024, 1160]] },
    { id: 'tennis_courts', name: '网球场', aliases: ['网球'], points: [[1030, 680], [1227, 680], [1227, 760], [1030, 760]] },
    { id: 'underground_training_hall', name: '地下训练馆', aliases: ['训练馆'], points: [[940, 585], [1004, 585], [1004, 642], [940, 642]] },
    { id: 'campus_north_gate', name: '北门', aliases: ['北校门'], points: [[1148, 330], [1195, 330], [1195, 370], [1148, 370]] },
    { id: 'campus_east_gate', name: '东门', aliases: ['东校门'], points: [[1808, 828], [1850, 828], [1850, 873], [1808, 873]] },
    { id: 'campus_south_gate', name: '南门', aliases: ['南校门'], points: [[635, 1400], [680, 1400], [680, 1440], [635, 1440]] },
    { id: 'campus_west_gate', name: '西门', aliases: ['西校门'], points: [[360, 432], [402, 432], [402, 476], [360, 476]] },
    { id: 'north_dormitories', name: '北区宿舍', aliases: ['学生公寓01', '学生公寓02', '学生公寓03', '学生公寓04'], points: [[390, 115], [946, 115], [946, 255], [390, 255]] },
    { id: 'northeast_dormitories', name: '东北区宿舍', aliases: ['学生公寓10', '学生公寓11'], points: [[943, 282], [1158, 282], [1158, 350], [943, 350]] },
    { id: 'central_dormitories', name: '中区宿舍', aliases: ['学生公寓07', '学生公寓08', '学生公寓09', '学生公寓10', '学生公寓11', '学生公寓12'], points: [[818, 682], [1008, 682], [1008, 992], [818, 992]] },
    { id: 'south_dormitories', name: '南区宿舍', aliases: ['学生公寓05', '学生公寓06'], points: [[740, 1068], [992, 1068], [992, 1230], [740, 1230]] },
    { id: 'east_dormitories', name: '东区宿舍', aliases: ['学生公寓13', '学生公寓14'], points: [[1198, 367], [1372, 367], [1372, 490], [1198, 490]] },
    { id: 'student_service_center', name: '学生综合服务楼', aliases: ['北区食堂', '天天餐厅', '民族食堂'], points: [[695, 116], [821, 116], [821, 255], [695, 255]] }
  ]
};

const getLocation = (locationId) => CAMPUS_MAP.locations.find((item) => item.id === locationId);

module.exports = { CAMPUS_MAP, getLocation };
