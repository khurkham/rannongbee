INSERT OR IGNORE INTO products (id, slug, name_th, description, price_thb, image_url, is_active) VALUES
('p01','khao-moo-tod','ข้าวหมูทอด','หมูทอดกรอบนอกนุ่มใน',60,'',1),
('p02','khao-kai-tod','ข้าวไก่ทอด','ไก่ทอดสูตรโฮมเมด',60,'',1),
('p03','kraprao-moo','ข้าวกะเพราหมู','กะเพราหมูรสเข้ม',55,'',1),
('p04','kraprao-kai','ข้าวกะเพราไก่','กะเพราไก่หอมๆ',55,'',1),
('p05','pad-thai','ผัดไทย','เส้นเหนียวนุ่ม',60,'',1),
('p06','rad-na','ราดหน้า','เส้นใหญ่ราดหน้าหอมๆ',60,'',1),
('p07','tom-yum','ต้มยำ','ต้มยำรสจัดจ้าน',70,'',1),
('p08','somtam','ส้มตำ','เผ็ดแซ่บ',50,'',1),
('p09','larb-moo','ลาบหมู','ลาบหมูรสกลมกล่อม',60,'',1),
('p10','namtok-moo','น้ำตกหมู','หอมข้าวคั่ว',60,'',1),
('p11','kao-man-kai','ข้าวมันไก่','ข้าวมันไก่นุ่มๆ',60,'',1),
('p12','fried-rice','ข้าวผัด','ข้าวผัดหอมกระทะ',55,'',1),
('p13','noodle-soup','ก๋วยเตี๋ยวน้ำ','ซุปหอมหวาน',60,'',1),
('p14','boat-noodle','ก๋วยเตี๋ยวเรือ','เข้มข้น',65,'',1),
('p15','green-curry','แกงเขียวหวาน','กะทิหอม',70,'',1),
('p16','massaman','แกงมัสมั่น','นุ่มละมุน',75,'',1),
('p17','stir-fried-veg','ผัดผักรวม','ผักสดกรอบ',55,'',1),
('p18','omelet','ไข่เจียว','ไข่เจียวฟู',45,'',1),
('p19','pork-satay','หมูสะเต๊ะ','หอมเครื่องเทศ',70,'',1),
('p20','dessert','ของหวานประจำวัน','เปลี่ยนตามวัน',40,'',1);

INSERT OR IGNORE INTO coupons (id, code, kind, value, min_subtotal_thb, max_redemptions, max_per_customer, starts_at, ends_at, is_active) VALUES
('c01','NB10','percent',10,200,NULL,1,NULL,NULL,1),
('c02','NB50','fixed',50,300,NULL,1,NULL,NULL,1),
('c03','FREEMUEANG','free_shipping',0,0,NULL,1,NULL,NULL,1),
('c04','NEWBEE','percent',15,150,NULL,1,NULL,NULL,1),
('c05','WEEKEND20','fixed',20,250,NULL,1,NULL,NULL,1);
