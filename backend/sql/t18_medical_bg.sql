SET NAMES utf8mb4;

-- T18 医保报销(medical)短剧情：全程统一校医院背景，无学姐立绘。负责人：任晟达。

UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/medical_hospital.jpg', character_image_url=NULL WHERE story_id=(SELECT id FROM stories WHERE code='medical');
