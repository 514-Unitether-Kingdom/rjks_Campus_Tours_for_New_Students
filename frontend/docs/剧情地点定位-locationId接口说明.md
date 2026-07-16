# 剧情地点定位（`locationId`）接口说明

## 目的

剧情节点在有明确场景地点时，前端展示 `map2.png` 并以半透明色块高亮对应建筑或区域。地点配置维护在 `frontend/utils/campus-map.js`，底图替换时无需改变剧情页面。

## 后端改动

为 `story_nodes` 增加可空字段：

```sql
ALTER TABLE story_nodes ADD COLUMN location_id VARCHAR(64) NULL COMMENT '剧情节点对应的校园地图地点 ID';
```

在剧情节点 DTO 中增加：

```js
locationId: row.location_id || null
```

`GET /api/stories/:id/nodes` 的单个节点示例：

```json
{
  "id": "n3",
  "text": "我们到图书馆看看。",
  "locationId": "library",
  "isEnd": false,
  "sortOrder": 3
}
```

没有明确地点、过渡镜头或校外内容时，返回 `null` 或省略 `locationId`。通常一个节点只传一个最主要的地点；需要同页对照的相邻地点（如两处校门）可用英文逗号拼接两个 ID，例如 `campus_west_gate,campus_west_side_gate`，前端会同时高亮并聚焦两处区域。

## 可用地点 ID

| locationId | 地点 |
| --- | --- |
| `no1_teaching_building` / `no2_teaching_building` / `no3_teaching_building` / `no4_teaching_building` | 第一至第四教学楼 |
| `material_building` / `information_building` / `information_building_east` | 材料楼、信息楼、信息楼东 |
| `mechanical_electrical_building` / `intelligent_research_building` | 机电楼、智研楼 |
| `green_building` / `energy_building` / `heating_ventilation_building` | 绿建楼、能源楼、暖通楼 |
| `construction_building` / `urban_construction_building` / `practice_training_building` | 建工楼、城建楼、实训楼 |
| `environment_energy_building` / `life_science_building` | 环能楼、生命楼 |
| `physical_science_building` / `science_building` | 数理楼、科学楼 |
| `humanities_building` / `economics_management_building` / `art_building` | 人文楼、经管楼、艺术楼 |
| `software_building` / `library` / `auditorium` | 软件楼、图书馆、礼堂 |
| `north_sports_ground` / `south_sports_ground` / `swimming_pool` / `table_tennis_hall` / `olympic_venue` | 北体育场、南体育场、游泳馆、乒乓球馆、奥运场馆 |
| `express_station` / `school_hospital` | 快递站、校医院 |
| `campus_north_gate` / `campus_east_gate` / `campus_south_gate` / `campus_west_gate` / `campus_southeast_gate` / `campus_west_side_gate` | 北门、东门、南门、西门、东南门、西侧小门 |
| `north_dormitories` / `central_dormitories` / `south_dormitories` / `east_dormitories` | 北、中、南、东区宿舍 |
| `student_service_center` | 学生综合服务楼（含北区食堂、天天餐厅、民族食堂） |

前端同时保留中文别名，方便文案核对；接口必须传表中的英文 `locationId`，不要直接传地点中文名。
