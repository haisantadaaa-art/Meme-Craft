/**
 * KHO CÂU HỎI DỰ PHÒNG PHÂN TẦNG ĐỘ KHÓ 150+ CÂU HỎI CHO "AI LÀ TRIỆU PHÚ"
 * Phân tầng chuẩn 3 cấp độ:
 * - Tier 1 (Cực Dễ - Mốc 1 đến 5): 50 câu hỏi đời sống, trà sữa, món ăn vặt quen thuộc
 * - Tier 2 (Trung Bình - Mốc 6 đến 10): 50 câu hỏi đặc sản vùng miền, kiến thức địa lý ẩm thực, ca dao
 * - Tier 3 (Hóc Búa - Mốc 11 đến 15): 50 câu hỏi chuyên sâu, lịch sử, nghệ thuật cung đình, nguyên liệu quý
 */

// ========================================================
// TIER 1: CÂU HỎI CỰC DỄ (MỐC 1 - 5) - 50 CÂU
// ========================================================
export const TIER1_EASY_QUESTIONS = [
  {
    question: 'Thành phần chính tạo nên độ dai dẻo của Hạt Trân Châu trong Trà Sữa là loại bột nào?',
    options: ['Bột Năng (Tinh bột sắn)', 'Bột Mì đa dụng', 'Bột Bắp vàng', 'Bột Gạo tẻ'],
    correct: 0,
    explanation: 'Bột năng khi nhào với nước sôi và luộc chín sẽ tạo độ dẻo dai đặc trưng của trân châu.',
  },
  {
    question: 'Loại rau thơm nào kinh điển không thể thiếu trong bát Phở Bò truyền thống miền Bắc?',
    options: ['Hành hoa & Ngò rí', 'Lá lốt & Tía tô', 'Cần tây & Thì là', 'Rau diếp cá'],
    correct: 0,
    explanation: 'Phở bò Hà Nội chuẩn mực phải có nhiều đầu hành hoa chẻ và ngò rí thái nhỏ.',
  },
  {
    question: 'Bánh Mì kẹp pate truyền thống của Việt Nam thường được nướng lại bằng gì cho nóng giòn?',
    options: ['Lò nướng hoặc máy ép', 'Nồi hấp cách thủy', 'Nồi chiên ngập dầu', 'Tủ lạnh'],
    correct: 0,
    explanation: 'Bánh mì nướng lò hoặc ép nhiệt giúp vỏ ngoài giòn rụm, ruột mềm thơm.',
  },
  {
    question: 'Cốc Cà Phê Sữa Đá Sài Gòn sử dụng loại sữa nào là chủ yếu?',
    options: ['Sữa đặc có đường', 'Sữa tươi thanh trùng', 'Sữa chua men sống', 'Sữa hạt sen'],
    correct: 0,
    explanation: 'Sữa đặc có đường hòa quyện cùng cà phê phin đậm đà tạo nên hương vị kinh điển.',
  },
  {
    question: 'Món Bánh Cuốn nóng hổi thường được tráng mỏng trên dụng cụ làm bằng chất liệu gì?',
    options: ['Tấm vải căng trên nồi nước sôi', 'Chảo rán chống dính', 'Vỉ nướng than hồng', 'Nồi áp suất'],
    correct: 0,
    explanation: 'Nồi tráng bánh cuốn dùng tấm vải căng trên miệng nồi nước sôi bốc hơi cực nóng.',
  },
  {
    question: 'Loại củ nào sau đây làm nên màu vàng óng ả tự nhiên cho món Xôi Xéo?',
    options: ['Củ Nghệ', 'Củ Cà rốt', 'Củ Khoai tây', 'Củ Dền'],
    correct: 0,
    explanation: 'Gạo nếp ngâm nước cốt nghệ tươi sẽ cho màu vàng óng ả bắt mắt.',
  },
  {
    question: 'Thức uống nào giải khát mùa hè làm từ hạt quả sấu ngâm đường chua ngọt nổi tiếng Hà Nội?',
    options: ['Nước Sấu ngâm', 'Nước Mía siêu sạch', 'Nước Dừa xiêm', 'Trà Sâm bí đao'],
    correct: 0,
    explanation: 'Nước sấu ngâm gừng chua ngọt thanh mát là biểu tượng mùa hè của thủ đô.',
  },
  {
    question: 'Bánh Tráng Trộn Sài Gòn thường được vắt thêm nước cốt của loại quả chua nào?',
    options: ['Quả Tắc (Quất)', 'Quả Me chín', 'Quả Bưởi', 'Quả Khế chua'],
    correct: 0,
    explanation: 'Nước cốt tắc thơm nồng vị tinh dầu giúp bánh tráng mềm và dậy mùi hấp dẫn.',
  },
  {
    question: 'Món Nem Rán (Chả Giò) miền Nam thường dùng bánh tráng hoặc bánh gì để cuốn ngoài?',
    options: ['Bánh tráng bía (bánh pía mềm)', 'Bánh phở tươi', 'Bánh đa vừng', 'Lá dong xanh'],
    correct: 0,
    explanation: 'Bánh tráng bía xốp nhẹ giúp chả giò khi chiên vàng ươm và giữ độ giòn lâu.',
  },
  {
    question: 'Loại gia vị nào sau đây có vị cay nồng đặc trưng dùng trong hầu hết các món canh cá?',
    options: ['Ớt & Tiêu', 'Mật ong', 'Đường phèn', 'Sữa đặc'],
    correct: 0,
    explanation: 'Ớt và tiêu khử mùi tanh của cá và kích thích vị giác người ăn.',
  },
  {
    question: 'Món Xôi Gấc có màu đỏ cam rực rỡ tượng trưng cho điều gì trong ngày lễ Tết?',
    options: ['Sự may mắn và hạnh phúc', 'Sự mát mẻ ngày hè', 'Nỗi buồn chia xa', 'Sự tĩnh lặng'],
    correct: 0,
    explanation: 'Màu đỏ của gấc tượng trưng cho vận đỏ, may mắn và thịnh vượng cả năm.',
  },
  {
    question: 'Nước Chanh Đá truyền thống gồm 3 thành phần cơ bản nào?',
    options: ['Chanh, Đường, Nước & Đá', 'Chanh, Muối hột, Sữa đặc', 'Chanh, Rượu nếp, Gừng', 'Chanh, Giấm gạo, Tiêu'],
    correct: 0,
    explanation: 'Nước cốt chanh tươi pha với nước đường và đá lạnh là thức uống giải nhiệt quốc dân.',
  },
  {
    question: 'Món Canh Cua Mồng Tơi thường được ăn kèm với loại quả muối chua nào?',
    options: ['Cà Pháo muối giòn', 'Dưa chuột muối cay', 'Quả vú sữa', 'Quả sung chát'],
    correct: 0,
    explanation: 'Cơm canh cua, rau đay mồng tơi ăn kèm cà pháo giòn tan là bữa cơm hè hoàn hảo.',
  },
  {
    question: 'Trà Sữa Trân Châu xuất xứ ban đầu từ quốc gia/vùng lãnh thổ nào?',
    options: ['Đài Loan (Trung Quốc)', 'Ý (Italy)', 'Pháp (France)', 'Ấn Độ (India)'],
    correct: 0,
    explanation: 'Trà sữa trân châu ra đời tại Đài Loan vào những năm 1980 trước khi lan rộng toàn cầu.',
  },
  {
    question: 'Thành phần chính của món Tào Phớ (Tàu Hũ) thanh mát là gì?',
    options: ['Đậu nành (Đậu tương)', 'Bột sắn dây', 'Gạo nếp cái hoa vàng', 'Hạt chia hữu cơ'],
    correct: 0,
    explanation: 'Tào phớ làm từ sữa đậu nành kết tủa mịn màng, chan nước đường ướp hoa nhài.',
  },
  {
    question: 'Bánh Giò Hà Nội thường được gói bằng loại lá gì để có màu xanh tự nhiên?',
    options: ['Lá chuối', 'Lá lốt', 'Lá cọ xòe', 'Lá bàng già'],
    correct: 0,
    explanation: 'Bánh giò gói bằng nhiều lớp lá chuối xanh thơm phức khi hấp chín.',
  },
  {
    question: 'Món Chuối Nếp Nướng miền Tây dùng loại quả chuối nào làm nhân bên trong?',
    options: ['Chuối sứ (Chuối xiêm)', 'Chuối tiêu xanh', 'Chuối ngự tí hon', 'Chuối hột chát'],
    correct: 0,
    explanation: 'Chuối sứ chín ngọt đậm đà, không bị chát khi bọc nếp nướng trên than hoa.',
  },
  {
    question: 'Loại quả nào có múi đỏ hoặc hồng ngọt lịm, thường xuất hiện nhiều vào dịp Tết Trung Thu?',
    options: ['Quả Bưởi', 'Quả Khế ngọt', 'Quả Mận tím', 'Quả Cóc bao tử'],
    correct: 0,
    explanation: 'Tép bưởi hồng tép tôm làm mâm cỗ Trung Thu thêm rực rỡ và thanh mát.',
  },
  {
    question: 'Món Gà Rán giòn rụm thường được nhúng qua lớp bột chiên giòn và bột gì?',
    options: ['Bột chiên xù', 'Bột ca cao', 'Bột quế chi', 'Bột trà xanh matcha'],
    correct: 0,
    explanation: 'Bột chiên xù bám ngoài giúp miếng gà phồng to và giòn tan khi cắn.',
  },
  {
    question: 'Món Chè Bưởi bùi bùi nổi tiếng nhờ phần cùi bưởi được ngâm bóp kỹ để hết vị gì?',
    options: ['Vị Đắng chát', 'Vị Chua gắt', 'Vị Cay xè', 'Vị Mặn mòi'],
    correct: 0,
    explanation: 'Cùi bưởi phải bóp muối xả nước nhiều lần để loại bỏ hoàn toàn vị đắng của tinh dầu.',
  },
  {
    question: 'Cây Bạc Hà (Húng Cay) thường mang lại cảm giác gì khi ăn vào vòm họng?',
    options: ['Mát lạnh sảng khoái', 'Nóng rực bỏng rát', 'Chua buốt răng', 'Ngọt ngào như kẹo'],
    correct: 0,
    explanation: 'Chất menthol tự nhiên trong lá bạc hà tạo cảm giác the mát cực đã.',
  },
  {
    question: 'Món Bánh Bao truyền thống thường có phần nhân thịt băm kết hợp với loại trứng nào?',
    options: ['Trứng cút hoặc trứng muối', 'Trứng đà điểu', 'Trứng kiến gai đen', 'Trứng cá hồi'],
    correct: 0,
    explanation: 'Bánh bao nhân thịt, mộc nhĩ, miến cùng quả trứng cút luộc tròn xoe thơm nức.',
  },
  {
    question: 'Quả Xoài Lắc muối tôm là món ăn vặt đường phố nổi tiếng nhất định phải dùng xoài gì?',
    options: ['Xoài keo hoặc xoài xanh giòn', 'Xoài chín nẫu ngọt lịm', 'Xoài sấy khô dẻo', 'Xoài đông lạnh'],
    correct: 0,
    explanation: 'Xoài xanh chua giòn kết hợp muối tôm Tây Ninh cay nồng tạo nên cơn sốt ăn vặt.',
  },
  {
    question: 'Món Trứng Vịt Lộn ăn kèm với loại rau răm có tác dụng gì theo y học dân gian?',
    options: ['Cân bằng tính hàn - nhiệt', 'Làm trứng nở to hơn', 'Làm giảm độ ngọt', 'Tạo màu xanh cho vỏ'],
    correct: 0,
    explanation: 'Rau răm tính ấm, vị cay nồng giúp tiêu thực và cân bằng tính hàn của trứng vịt.',
  },
  {
    question: 'Món Bánh Xèo giòn rụm của người Việt Nam khi đổ bột vào chảo phát ra tiếng gì đặc trưng?',
    options: ['Tiếng "Xèo xèo" lớn', 'Tiếng "Tách tách"', 'Tiếng "Ầm ầm"', 'Tiếng im lìm'],
    correct: 0,
    explanation: 'Tên gọi Bánh Xèo xuất phát từ chính âm thanh vui tai khi bột tiếp xúc với chảo dầu nóng.',
  },
  {
    question: 'Món Canh Chua cá lóc miền Tây tạo vị chua tự nhiên từ loại quả hoặc lá nào?',
    options: ['Quả Me hoặc Trái Giác', 'Quả Vải thiều', 'Quả Na dai', 'Lá Trà xanh'],
    correct: 0,
    explanation: 'Nước cốt me chua thanh dịu làm nước canh chua ngọt hài hòa không gắt.',
  },
  {
    question: 'Trà Đào Cam Sả thường sử dụng loại đào nào để topping giòn thơm ngọt?',
    options: ['Miếng Đào ngâm đóng hộp', 'Đào tươi xanh chát', 'Đào khô gặm hạt', 'Quả Đào chuông'],
    correct: 0,
    explanation: 'Đào miếng giòn ngọt ngâm siro là linh hồn của ly trà đào cam sả thanh mát.',
  },
  {
    question: 'Hạt Sen tươi sau khi bóc vỏ phải lấy bỏ phần nào để khi nấu chè không bị đắng ngắt?',
    options: ['Tâm sen (Tim sen màu xanh)', 'Màng lụa ngoài', 'Cuống sen', 'Phần cơm trắng'],
    correct: 0,
    explanation: 'Tâm sen có vị rất đắng (dùng làm thuốc), cần thông bỏ để chè sen thơm ngọt bùi.',
  },
  {
    question: 'Bún Đậu Mắm Tôm chuẩn vị thì bát mắm tôm phải được đánh bông lên cùng nguyên liệu gì?',
    options: ['Nước cốt quất (tắc), đường & dầu sôi', 'Nước mắm tỏi ớt', 'Sữa chua', 'Nước dừa tươi'],
    correct: 0,
    explanation: 'Mắm tôm đánh cùng tắc và đường, chan thìa mỡ rán đậu sôi sùng sục sẽ thơm nức mũi.',
  },
  {
    question: 'Thịt Kho Tàu ngày Tết miền Nam thường được kho chung với nước của loại quả nào?',
    options: ['Nước Dừa tươi', 'Nước Cam vắt', 'Nước Nho đen', 'Nước Ép dưa hấu'],
    correct: 0,
    explanation: 'Nước dừa xiêm kho liu riu làm thịt mềm rục, mỡ trong veo và có màu cánh gián tự nhiên.',
  },
  {
    question: 'Món Kem Tràng Tiền nổi tiếng bậc nhất thủ đô Hà Nội có hương vị truyền thống nào?',
    options: ['Cốm non & Đậu xanh', 'Vani socola nhập khẩu', 'Dâu tây Đà Lạt', 'Phô mai béo ngậy'],
    correct: 0,
    explanation: 'Kem que cốm và đậu xanh dẻo thơm là ký ức ngọt ngào gắn bó với bao thế hệ người Hà Nội.',
  },
  {
    question: 'Quả Bơ Sáp Đắk Lắk khi chín thường được dầm cùng sữa đặc và đá gọi là món gì?',
    options: ['Bơ Dầm Sữa Đá', 'Bơ Nướng Mỡ Hành', 'Bơ Kho Nước Mắm', 'Bơ Xào Tỏi'],
    correct: 0,
    explanation: 'Bơ sáp béo ngậy dầm cùng sữa đặc và đá bào là món giải khát bổ dưỡng tuyệt hảo.',
  },
  {
    question: 'Bánh Gai đặc sản Nam Định có màu đen tuyền bắt mắt nhờ loại lá cây nào?',
    options: ['Lá Gai phơi khô giã nhuyễn', 'Lá Chuối khô', 'Lá Rong biển', 'Lá Tre non'],
    correct: 0,
    explanation: 'Lá gai nghiền nhào với bột nếp tạo màu đen nhánh huyền bí cùng hương thơm thảo mộc.',
  },
  {
    question: 'Bánh Chưng ngày Tết cổ truyền được gói bằng lá gì là phổ biến và thơm ngon nhất?',
    options: ['Lá Dong rừng xanh mướt', 'Lá Sen khô', 'Lá Bắp cải', 'Lá Cọ dầu'],
    correct: 0,
    explanation: 'Lá dong xanh cho hương thơm mộc mạc và giữ màu vỏ bánh chưng luôn xanh tươi.',
  },
  {
    question: 'Món Khoai Lang Nướng than hồng vào mùa đông miền Bắc có hương thơm lan tỏa nhờ chất gì?',
    options: ['Mật ngọt tự nhiên trong khoai', 'Dầu ăn phết ngoài', 'Muối tinh rắc lên', 'Nước mắm chấm'],
    correct: 0,
    explanation: 'Đường mật trong củ khoai lang khi gặp nhiệt than nướng sẽ chảy mật dẻo quánh thơm lừng.',
  },
  {
    question: 'Nước Mía siêu sạch thường được người bán ép chung với nửa quả gì để tăng hương thơm?',
    options: ['Quả Quất (Tắc) hoặc lát Dứa', 'Quả Ổi xá lị', 'Quả Hồng xiêm', 'Quả Chuối ngự'],
    correct: 0,
    explanation: 'Vỏ quất ép cùng thân mía tiết ra tinh dầu thơm mát, cân bằng vị ngọt sắc.',
  },
  {
    question: 'Món Bánh Mì Chảo thường có các nguyên liệu chính nào sau đây?',
    options: ['Pate, Trứng ốp la, Xúc xích & Nước sốt', 'Thịt kho trứng vịt', 'Cá viên chiên chấm tương đen', 'Bún tươi rau sống'],
    correct: 0,
    explanation: 'Chiếc chảo gang nóng hổi xèo xèo pate, trứng lòng đào chấm bánh mì giòn tan.',
  },
  {
    question: 'Chè Khúc Bạch thanh mát có những viên "khúc bạch" mềm béo làm từ sữa tươi và nguyên liệu gì?',
    options: ['Kem tươi (Whipping cream) & Gelatin', 'Bột gạo tẻ', 'Thạch rau câu dẻo', 'Lòng đỏ trứng gà'],
    correct: 0,
    explanation: 'Hỗn hợp kem sữa kết đông bằng gelatin tạo nên độ tan mềm mượt như lụa.',
  },
  {
    question: 'Cá Bẫy Trầu, Cá Lóc kho tộ miền Nam thường được kho trong loại nồi/niêu nào?',
    options: ['Tộ Đất (Niêu đất nung)', 'Nồi Nhôm mỏng', 'Chảo Rán inox', 'Bát Thủy tinh'],
    correct: 0,
    explanation: 'Tộ đất giữ nhiệt cực lâu giúp cá ngấm đều gia vị, thịt săn chắc và nước kho sánh kẹo.',
  },
  {
    question: 'Món Hủ Tiếu Nam Vang trứ danh có nguồn gốc giao thoa ẩm thực từ đất nước láng giềng nào?',
    options: ['Campuchia', 'Lào', 'Thái Lan', 'Indonesia'],
    correct: 0,
    explanation: 'Nam Vang là tên Hán Việt của thủ đô Phnom Penh (Campuchia).',
  },
  {
    question: 'Bánh Cốm Hàng Than (Hà Nội) có lớp nhân ngọt bùi bên trong làm bằng gì?',
    options: ['Đậu xanh sên đường nhuyễn', 'Thịt heo quay xá xíu', 'Socola hạnh nhân', 'Mứt dừa sợi cay'],
    correct: 0,
    explanation: 'Vỏ cốm xanh dẻo thơm bọc lấy nhân đậu xanh vàng mịn ngọt thanh tao.',
  },
  {
    question: 'Món Mì Quảng đậm đà xứ Quảng thường được ăn cùng loại bánh tráng nào?',
    options: ['Bánh tráng mè nướng giòn rụm', 'Bánh tráng phơi sương mềm', 'Bánh đa nem dẻo', 'Bánh phồng tôm chiên'],
    correct: 0,
    explanation: 'Bẻ miếng bánh tráng mè giòn tan vào tô mì Quảng tạo nên độ ròn rụm khó quên.',
  },
  {
    question: 'Rau Muống Xào Tỏi muốn xanh mướt và giòn ngọt thì phải xào trên ngọn lửa như thế nào?',
    options: ['Lửa to và đảo thật nhanh tay', 'Lửa liu riu đậy vung kín', 'Lửa tắt ngấm ngâm nước', 'Lửa nhỏ ninh nhừ'],
    correct: 0,
    explanation: 'Xào lửa lớn giúp rau chín nhanh, không bị úa vàng và giữ nguyên độ giòn ngọt.',
  },
  {
    question: 'Loại hạt nào sau đây được rang muối thơm bùi, thường xuất hiện trên bàn tiếp khách ngày Tết?',
    options: ['Hạt Dưa đỏ hoặc Hạt Hướng dương', 'Hạt Cơm nguội', 'Hạt Đậu đen sống', 'Hạt Ớt cay'],
    correct: 0,
    explanation: 'Tiếng cắn hạt dưa, hạt hướng dương tí tách là âm thanh rộn ràng đặc trưng ngày Tết.',
  },
  {
    question: 'Nước dừa tươi ngon nhất nên uống khi nào?',
    options: ['Vừa chặt từ trái dừa tươi', 'Để qua đêm ngoài trời nắng', 'Đun sôi thật lâu', 'Pha thêm giấm ăn'],
    correct: 0,
    explanation: 'Nước dừa uống liền sau khi chặt giữ trọn vẹn vị ngọt thanh và khoáng chất tự nhiên.',
  },
  {
    question: 'Món Cháo Sườn Hà Nội truyền thống nấu bằng bột gạo xay mịn hay hạt gạo nguyên?',
    options: ['Bột gạo tẻ xay nước mịn màng', 'Gạo nếp hạt to ninh nhừ', 'Bột ngô ngọt xay thô', 'Bột mì nhào khô'],
    correct: 0,
    explanation: 'Cháo sườn Hà Nội trứ danh sánh mịn như kem nhờ nấu từ bột gạo tẻ xay nước.',
  },
  {
    question: 'Món Bánh Giầy kẹp giò lụa gắn liền với truyền thuyết dân gian nào của dân tộc Việt Nam?',
    options: ['Sự tích Bánh Chưng - Bánh Giầy (Lang Liêu)', 'Sự tích Cây Khế', 'Truyền thuyết Sơn Tinh - Thủy Tinh', 'Truyện Thạch Sanh'],
    correct: 0,
    explanation: 'Lang Liêu dùng gạo nếp làm bánh Chưng vuông tượng trưng cho Đất và bánh Giầy tròn tượng trưng cho Trời.',
  },
  {
    question: 'Món Trà Chanh "Chém Gió" vỉa hè Hà Nội thường được cắn kèm với món đồ nhắm nào?',
    options: ['Hạt Hướng Dương giòn tan', 'Tôm hùm nướng bơ tỏi', 'Thịt bò bít tết', 'Cơm lam nướng ống tre'],
    correct: 0,
    explanation: 'Cốc trà chanh mát lạnh và đĩa hướng dương là combo bất hủ của giới trẻ tụ tập vỉa hè.',
  },
  {
    question: 'Món Thịt Luộc chấm mắm tôm hoặc mắm tép nên chọn phần thịt heo nào ngon nhất?',
    options: ['Thịt ba chỉ (ba rọi) có nạc mỡ xen kẽ', 'Thịt thăn khô khốc', 'Thịt mỡ lá ngấy', 'Xương ống hầm'],
    correct: 0,
    explanation: 'Thịt ba chỉ luộc vừa chín tới mềm mọng, lớp mỡ giòn và nạc ngọt chấm mắm tép cực đỉnh.',
  },
  {
    question: 'Để luộc trứng lòng đào có lòng đỏ dẻo sánh, thời gian luộc tính từ khi nước sôi khoảng mấy phút?',
    options: ['Khoảng 5 - 6 phút', 'Khoảng 25 - 30 phút', 'Khoảng 1 tiếng đồng hồ', 'Chỉ 30 giây'],
    correct: 0,
    explanation: 'Luộc 5-6 phút rồi ngâm ngay vào nước đá sẽ có quả trứng lòng đào dẻo quánh tuyệt hảo.',
  },
];

// ========================================================
// TIER 2: CÂU HỎI TRUNG BÌNH (MỐC 6 - 10) - 50 CÂU
// ========================================================
export const TIER2_MEDIUM_QUESTIONS = [
  {
    question: 'Món Cà Phê Trứng béo ngậy trứ danh thủ đô Hà Nội do cụ ai sáng tạo vào những năm 1940?',
    options: ['Cụ Nguyễn Văn Giảng (Giảng Cafe)', 'Cụ Đinh Lễ', 'Cụ Lâm Văn Bền', 'Cụ Nguyễn Văn Năng'],
    correct: 0,
    explanation: 'Cụ Giảng sáng tạo cà phê trứng thay cho sữa tươi đắt đỏ thời kỳ kháng chiến thiếu thốn.',
  },
  {
    question: 'Nước mắm Phú Quốc truyền thống nổi tiếng thế giới được ủ chượp từ loại cá nào?',
    options: ['Cá Cơm than & Cơm sọc tiêu', 'Cá Nục gai', 'Cá Thu phấn', 'Cá Rô phi đồng'],
    correct: 0,
    explanation: 'Cá cơm tươi đánh bắt tại vùng biển Phú Quốc cho ra nước mắm màu cánh gián đậm đà hổ phách.',
  },
  {
    question: 'Bánh Mì Việt Nam vinh dự được từ điển Oxford danh giá của Anh đưa vào danh mục từ mới năm nào?',
    options: ['Năm 2011', 'Năm 2000', 'Năm 1995', 'Năm 2021'],
    correct: 0,
    explanation: 'Năm 2011, từ "Banh mi" chính thức gia nhập từ điển Oxford mà không cần chuyển ngữ.',
  },
  {
    question: 'Món Bún Bò Huế chính gốc sử dụng loại bún có sợi như thế nào?',
    options: ['Sợi bún to tròn đặc trưng', 'Sợi bún mảnh như bún chả', 'Sợi bún dẹt như sợi phở', 'Sợi miến dong xám'],
    correct: 0,
    explanation: 'Bún bò Huế đặc trưng với sợi bún to tròn, ngấm vị cay nồng của ớt sa tế và mùi sả mắm ruốc.',
  },
  {
    question: 'Món Cao Lầu trứ danh Phố cổ Hội An có sợi mì ngâm từ tro của loại cây nào trên Cù Lao Chàm?',
    options: ['Củi Tro cây Cù Lao Chàm', 'Tro cây Bạch đàn', 'Tro than tổ ong', 'Tro cây Dừa nước'],
    correct: 0,
    explanation: 'Nước tro từ củi Cù Lao Chàm tạo màu vàng ngà tự nhiên và độ giòn dai độc nhất cho sợi Cao Lầu.',
  },
  {
    question: 'Vùng đất nào sau đây được mệnh danh là "Thủ phủ Cà Phê" của Việt Nam?',
    options: ['Buôn Ma Thuột (Đắk Lắk)', 'Đà Lạt (Lâm Đồng)', 'Pleiku (Gia Lai)', 'Kon Tum'],
    correct: 0,
    explanation: 'Buôn Ma Thuột sở hữu đất đỏ bazan màu mỡ sản sinh ra hạt cà phê Robusta ngon nức tiếng thế giới.',
  },
  {
    question: 'Bánh Pía thơm lừng mùi sầu riêng và trứng muối là đặc sản trứ danh của tỉnh thành nào?',
    options: ['Sóc Trăng', 'Bến Tre', 'Tiền Giang', 'Vĩnh Long'],
    correct: 0,
    explanation: 'Bánh Pía Vũng Thơm (Sóc Trăng) có nhiều lớp vỏ ngàn lớp xốp mềm bọc nhân sầu riêng hảo hạng.',
  },
  {
    question: 'Món Bún Chả Hà Nội từng được Tổng thống Mỹ Barack Obama và đầu bếp Anthony Bourdain thưởng thức vào năm nào?',
    options: ['Năm 2016', 'Năm 2012', 'Năm 2018', 'Năm 2008'],
    correct: 0,
    explanation: 'Tháng 5/2016, Tổng thống Obama đã thưởng thức bún chả Hương Liên tại phố Lê Văn Hưu, Hà Nội.',
  },
  {
    question: 'Món Cơm Cháy chà bông giòn tan sốt cay ngọt là đặc sản nức tiếng của tỉnh nào miền Bắc?',
    options: ['Ninh Bình', 'Hà Nam', 'Thái Bình', 'Nam Định'],
    correct: 0,
    explanation: 'Cơm cháy Ninh Bình chiên vàng giòn rụm ăn cùng sốt tim cật hoặc chà bông ruốc thịt.',
  },
  {
    question: 'Kẹo Dừa Bến Tre truyền thống gắn liền với làng nghề khởi nguồn ở địa phương nào?',
    options: ['Mỏ Cày (Bến Tre)', 'Châu Thành', 'Ba Tri', 'Giồng Trôm'],
    correct: 0,
    explanation: 'Làng nghề kẹo dừa Mỏ Cày ra đời từ những năm 1970 và trở thành niềm tự hào xứ dừa.',
  },
  {
    question: 'Gia vị "Hạt Mắc Khén" nồng nàn thơm như vỏ cam rừng là báu vật ẩm thực của vùng nào?',
    options: ['Tây Bắc', 'Tây Nguyên', 'Duyên hải Nam Trung Bộ', 'Đồng bằng sông Cửu Long'],
    correct: 0,
    explanation: 'Mắc khén được ví như "hạt tiêu rừng Tây Bắc", linh hồn cho các món nướng như Pa pỉnh tộp.',
  },
  {
    question: 'Món Gỏi Cuốn thanh mát của Việt Nam từng được đài CNN bình chọn vào top bao nhiêu món ăn ngon nhất hành tinh?',
    options: ['Top 50 món ngon nhất thế giới', 'Top 500', 'Top 1000', 'Chưa từng lọt bảng xếp hạng'],
    correct: 0,
    explanation: 'Gỏi cuốn tôm thịt thanh đạm lọt top những món ăn hấp dẫn nhất hành tinh do CNN bình chọn.',
  },
  {
    question: 'Bánh Tét lá cẩm tím biếc bắt mắt có xuất xứ nổi tiếng nhất từ tỉnh/thành nào ở miền Tây?',
    options: ['Cần Thơ', 'An Giang', 'Đồng Tháp', 'Cà Mau'],
    correct: 0,
    explanation: 'Bánh tét lá cẩm gia truyền họ Huỳnh ở Cần Thơ có nhân thịt mỡ, trứng muối và nếp tím tuyệt đẹp.',
  },
  {
    question: 'Nem Chua Thanh Hóa lên men chín tự nhiên nhờ thính gạo và đóng gói bằng lớp lá nào?',
    options: ['Lá Đinh lăng & Lá chuối tươi', 'Lá lốt xào tỏi', 'Lá dong già', 'Lá mít non'],
    correct: 0,
    explanation: 'Lá đinh lăng kẹp cùng tép tỏi ớt làm nem chua dậy mùi thơm nồng và diệt khuẩn tự nhiên.',
  },
  {
    question: 'Món Bánh Đa Cua Hải Phòng đặc trưng bởi sợi bánh đa có màu nâu đỏ nhờ nhuộm nguyên liệu gì?',
    options: ['Nước đường mía (Mật mía)', 'Huyết lợn luộc', 'Gấc đỏ chín', 'Phẩm màu tổng hợp'],
    correct: 0,
    explanation: 'Sợi bánh đa cua Hải Phòng tráng cùng nước mật mía tự nhiên nên dẻo dai và có màu đỏ nâu cánh gián.',
  },
  {
    question: 'Trà Shan Tuyết cổ thụ nghìn năm tuổi sinh trưởng tự nhiên trên những dãy núi cao hiểm trở ở đâu?',
    options: ['Hà Giang & Suối Giàng (Yên Bái)', 'Đà Lạt', 'Bảo Lộc', 'Thái Nguyên'],
    correct: 0,
    explanation: 'Cây chè Shan Tuyết cổ thụ phủ sương trắng quanh năm trên độ cao trên 1.500m ở vùng núi cao Tây Bắc.',
  },
  {
    question: 'Món Chả Cá Lã Vọng Hà Nội ăn kèm với bún, thì là và loại gia vị chấm không thể thay thế nào?',
    options: ['Mắm Tôm đánh bông với rượu và chanh', 'Tương bần hâm nóng', 'Nước mắm tỏi ớt loãng', 'Sốt mayonnaise chua'],
    correct: 0,
    explanation: 'Chả cá Lăng nướng than xào thì là hành hoa phải chấm mắm tôm mới bật hết vị béo bùi.',
  },
  {
    question: 'Vải Thiều ngon nhất Việt Nam nức tiếng xuất khẩu khắp thế giới là đặc sản của huyện nào?',
    options: ['Lục Ngạn (Bắc Giang)', 'Chí Linh (Hải Dương)', 'Đông Triều (Quảng Ninh)', 'Phù Cừ (Hưng Yên)'],
    correct: 0,
    explanation: 'Vải thiều Lục Ngạn quả tròn đỏ mọng, cùi dày hạt bé tí tẹo và ngọt lịm như mật.',
  },
  {
    question: 'Bánh Căn miền Trung (Phan Thiết, Nha Trang) thường được nướng trong khuôn làm bằng chất liệu gì?',
    options: ['Khuôn đất nung không tráng men', 'Chảo gang tráng men', 'Nồi thủy tinh', 'Khuôn silicon dẻo'],
    correct: 0,
    explanation: 'Khuôn đất nung giúp bánh căn thoát hơi tốt, vỏ dưới giòn rụm mà bên trên vẫn mềm xốp.',
  },
  {
    question: 'Nhãn Lồng tiến vua quả mọng nước, cùi giòn ngọt thanh là niềm tự hào của vùng đất nào?',
    options: ['Hưng Yên', 'Hải Dương', 'Vĩnh Phúc', 'Bắc Ninh'],
    correct: 0,
    explanation: 'Ca dao có câu: "Dù đi buôn Bắc bán Đông / Đố ai quên được nhãn lồng Hưng Yên".',
  },
  {
    question: 'Món Bún Nước Lèo Trà Vinh có mùi thơm đặc trưng từ loại mắm ủ nào của người Khmer?',
    options: ['Mắm Bò Hóc (Prohok)', 'Mắm Ba Khía', 'Mắm Tôm chua', 'Mắm Ruốc Huế'],
    correct: 0,
    explanation: 'Mắm Bò Hóc kết hợp cùng ngải bún và sả tạo nên hương vị bún nước lèo đậm đà khó quên.',
  },
  {
    question: 'Rượu Mẫu Sơn trong vắt như sương, men lá thảo mộc là đặc sản trứ danh của tỉnh nào?',
    options: ['Lạng Sơn', 'Cao Bằng', 'Lào Cai', 'Bắc Kạn'],
    correct: 0,
    explanation: 'Rượu Mẫu Sơn nấu từ gạo nương và nước suối ngàn trên đỉnh núi Mẫu Sơn quanh năm mây mù.',
  },
  {
    question: 'Món Cơm Hến xứ Huế thường được ăn kèm với phần nước dùng có nhiệt độ như thế nào?',
    options: ['Nước luộc hến nóng hổi chan lên cơm nguội', 'Nước đá lạnh ngắt', 'Nước trà xanh pha muối', 'Nước luộc gà béo'],
    correct: 0,
    explanation: 'Nét tinh tế của Cơm Hến là cơm nguội bùi bùi ăn cùng hến xào, rau bắp chuối và nước hến sôi sùng sục.',
  },
  {
    question: 'Tương Bần - loại nước chấm tiến vua nức tiếng thơm ngon làm từ đậu tương là của địa danh nào?',
    options: ['Thị trấn Bần Yên Nhân (Hưng Yên)', 'Thị xã Sơn Tây', 'Huyện Vĩnh Bảo', 'Huyện Gia Lộc'],
    correct: 0,
    explanation: 'Tương Bần ủ từ mốc xôi nếp và đỗ tương rang vàng tạo nên độ sánh ngọt tự nhiên.',
  },
  {
    question: 'Cá Bống Sông Trà kho tiêu cay nồng là món ăn biểu tượng gắn liền với con sông Trà Khúc ở tỉnh nào?',
    options: ['Quảng Ngãi', 'Quảng Nam', 'Bình Định', 'Phú Yên'],
    correct: 0,
    explanation: 'Cá bống sông Trà kho khô trong niêu đất với ớt bột là món quà quê trứ danh Quảng Ngãi.',
  },
  {
    question: 'Món Phở Chua với bánh phở dẻo, thịt xá xíu, lạc rang và nước sốt giấm đường là đặc sản của tỉnh nào?',
    options: ['Lạng Sơn & Cao Bằng', 'Hải Phòng', 'Nam Định', 'Thái Nguyên'],
    correct: 0,
    explanation: 'Phở chua Lạng Sơn ăn mát lành mùa hè với vị chua ngọt của nước sốt quả mác mật.',
  },
  {
    question: 'Gỏi Cá Mai tươi rói bóp chanh tái trộn thính là đặc sản biển nổi tiếng bậc nhất ở đâu?',
    options: ['Nha Trang & Phan Thiết', 'Cát Bà', 'Sầm Sơn', 'Đồ Sơn'],
    correct: 0,
    explanation: 'Cá mai trong suốt rút xương trộn thính cuốn bánh tráng chấm nước chấm đậu phộng tỏi ớt.',
  },
  {
    question: 'Món Bánh Khọt Vũng Tàu giòn rụm bên ngoài thường có nhân con gì đỏ au ở chính giữa?',
    options: ['Con Tôm biển tươi', 'Miếng Thịt bò Mỹ', 'Con Mực nang khổng lồ', 'Hạt Đậu phộng rang'],
    correct: 0,
    explanation: 'Bánh khọt Vũng Tàu đổ khuôn tròn nhỏ, chính giữa là chú tôm tươi rắc bột tôm cháy cam rực rỡ.',
  },
  {
    question: 'Thịt Trâu Gác Bếp Tây Bắc thường được tẩm ướp cùng loại ớt nào cay xé lưỡi?',
    options: ['Ớt Chỉ Thiên & Hạt Dổi rừng', 'Ớt Chuông ngọt', 'Ớt Bột Hàn Quốc', 'Tiêu xanh ngâm'],
    correct: 0,
    explanation: 'Hạt dổi rừng nướng than giã nhỏ quyện ớt cay xé tạo nên mùi khói bếp đặc trưng của thịt sấy.',
  },
  {
    question: 'Bánh Gai Tứ Trụ dẻo quánh nhân đậu xanh mỡ phần nức tiếng là của vùng đất nào?',
    options: ['Thọ Xuân (Thanh Hóa)', 'Lý Nhân (Hà Nam)', 'Yên Định', 'Triệu Sơn'],
    correct: 0,
    explanation: 'Làng Tứ Trụ thuộc huyện Thọ Xuân, Thanh Hóa nổi tiếng hàng trăm năm làm bánh gai tiến vua.',
  },
  {
    question: 'Trà Sen Tây Hồ tinh tế của Hà Nội cần ướp bao nhiêu bông hoa sen bách diệp để được 1kg trà?',
    options: ['Khoảng 1.000 đến 1.500 bông sen', 'Khoảng 10 bông sen', 'Khoảng 50 bông sen', 'Khoảng 200 bông sen'],
    correct: 0,
    explanation: 'Trà sen Tây Hồ ướp gạo sen bách diệp qua 7 lần sấy kỳ công tốn hơn 1.000 bông hoa cho 1kg trà.',
  },
  {
    question: 'Món Canh Bún Hà Nội có sợi bún to ăn kèm với loại rau đồng quê nào?',
    options: ['Rau Nhút (Rau Rút) hoặc Rau Cần', 'Rau Bắp cải thái chỉ', 'Rau Xà lách xoong', 'Rau Càng cua'],
    correct: 0,
    explanation: 'Bát canh bún riêu cua thanh mát ăn cùng rau rút giòn sần sật là nét ẩm thực phố cổ độc đáo.',
  },
  {
    question: 'Món Bún Bắp (Bún Ngô) độc lạ màu vàng tươi là đặc sản truyền thống của người dân huyện nào?',
    options: ['Tuy An (Phú Yên)', 'Hương Sơn (Hà Tĩnh)', 'Quỳnh Lưu (Nghệ An)', 'Điện Bàn (Quảng Nam)'],
    correct: 0,
    explanation: 'Bún bắp An Dân (Tuy An, Phú Yên) giã từ hạt bắp đỏ lên men công phu thơm ngọt dịu.',
  },
  {
    question: 'Bánh Hỏi lòng heo trứ danh ăn cùng bánh tráng mè nướng là đặc sản của tỉnh thành nào?',
    options: ['Bình Định', 'Ninh Thuận', 'Khánh Hòa', 'Phú Yên'],
    correct: 0,
    explanation: 'Người Bình Định ăn sáng bánh hỏi phết mỡ hành kèm đĩa lòng heo luộc và bát cháo lòng nóng hổi.',
  },
  {
    question: 'Loại quả chua chát nào được ví là "Linh hồn canh chua Nam Bộ" mọc ven sông nước lợ?',
    options: ['Trái Bần chua', 'Quả Mơ rừng', 'Quả Thanh trà', 'Quả Nhót chín'],
    correct: 0,
    explanation: 'Cây bần chua mọc ven bãi bồi, quả bần nấu canh chua cá ngát ngon ngọt thanh tao.',
  },
  {
    question: 'Món Khâu Nhục (Nham dục) béo ngậy mềm rục là món ăn truyền thống trong ngày cưới của dân tộc nào?',
    options: ['Dân tộc Tày & Nùng (Lạng Sơn)', 'Dân tộc Mông', 'Dân tộc Dao đỏ', 'Dân tộc Chăm'],
    correct: 0,
    explanation: 'Khâu nhục chế biến từ thịt ba chỉ luộc châm bì, tẩm mật ong rán giòn rồi chưng cách thủy với khoai môn.',
  },
  {
    question: 'Món Lẩu Mắm trứ danh miền Tây thường dùng loại cá nào để nấu nước cốt dậy mùi thơm?',
    options: ['Mắm Cá Linh hoặc Mắm Cá Sặc', 'Mắm Tôm biển', 'Mắm Tép chua', 'Mắm Cáy'],
    correct: 0,
    explanation: 'Nước cốt mắm cá linh cá sặc miền Tây nấu cùng sả ớt, ăn kèm hơn 20 loại rau đồng nội.',
  },
  {
    question: 'Rau Rừng Tây Ninh cuốn bánh tráng phơi sương Trảng Bàng nổi tiếng có bao nhiêu loại rau chính?',
    options: ['Hơn 30 loại rau rừng khác nhau', 'Chỉ 2 loại rau', 'Đúng 5 loại rau', 'Không dùng rau rừng'],
    correct: 0,
    explanation: 'Bánh tráng Trảng Bàng ăn cùng đọt cóc, lộc vừng, chòi mòi, sao nhái... phong phú vô cùng.',
  },
  {
    question: 'Món Gà Đồi Tiên Yên nức tiếng với câu ca "Gà Tiên Yên da vàng mọng ngọt" là của tỉnh nào?',
    options: ['Quảng Ninh', 'Bắc Giang', 'Thái Nguyên', 'Lạng Sơn'],
    correct: 0,
    explanation: 'Gà Tiên Yên thịt ngọt da giòn vàng ươm ăn cùng nước chấm cà sáy bí truyền Quảng Ninh.',
  },
  {
    question: 'Món Bánh Tằm Bì Bạc Liêu chan nước sốt gì béo ngậy khiến thực khách phương xa bất ngờ?',
    options: ['Nước Cốt Dừa béo ngọt chan lên bì heo', 'Nước sốt tương cà chua', 'Nước canh hầm xương bò', 'Nước giấm tỏi cay'],
    correct: 0,
    explanation: 'Sự kết hợp giữa sợi bánh tằm mặn, bì heo, rau thơm và nước cốt dừa béo ngọt tạo nên nét chấm phá kỳ thú.',
  },
  {
    question: 'Bánh Cuốn Thanh Trì (Hà Nội) truyền thống nổi tiếng vì điều gì?',
    options: ['Tráng mỏng như cánh ve, không có nhân thịt', 'Bánh dày cộp nhồi đầy thịt bò', 'Bánh chiên giòn rụm chấm mật', 'Bánh tráng bằng sữa bò tươi'],
    correct: 0,
    explanation: 'Bánh cuốn Thanh Trì truyền thống tráng chay siêu mỏng, phết mỡ hành hoa thơm lừng chấm nước mắm cà cuống.',
  },
  {
    question: 'Món Mắt Cá Ngừ Đại Dương hầm thuốc bắc trong thố đất là đặc sản trứ danh của vùng nào?',
    options: ['Phú Yên', 'Bình Thuận', 'Bà Rịa Vũng Tàu', 'Kiên Giang'],
    correct: 0,
    explanation: 'Mắt cá ngừ tiềm thuốc bắc béo ngậy giàu Omega-3 là "đèn pha đại dương" nổi danh xứ hoa vàng cỏ xanh.',
  },
  {
    question: 'Chè Cung Đình Huế truyền thống nổi tiếng với số lượng món chè phong phú lên tới bao nhiêu loại?',
    options: ['Hơn 36 loại chè tinh tế', 'Chỉ có 3 loại', 'Đúng 7 loại', '10 loại'],
    correct: 0,
    explanation: 'Chè Huế từ chè hạt sen bọc nhãn lồng đến chè bột lọc heo quay độc đáo có tới hơn 36 phong vị.',
  },
  {
    question: 'Món Pa Pỉnh Tộp (Cá gập nướng than hoa) là món ăn chiêu đãi khách quý của đồng bào dân tộc nào?',
    options: ['Dân tộc Thái Tây Bắc', 'Dân tộc Ba Na', 'Dân tộc Ê Đê', 'Dân tộc Mường'],
    correct: 0,
    explanation: 'Cá chép sông mổ lưng nhồi mắc khén rau thơm gập đôi lại nướng kẹp tre trên than hồng.',
  },
  {
    question: 'Bánh Xèo chảo khổng lồ miền Tây giòn tan thơm béo nhờ trong bột pha thêm loại nước nào?',
    options: ['Nước Cốt Dừa & Nước nghệ tươi', 'Nước trà xanh', 'Nước mía nguyên chất', 'Nước luộc thịt'],
    correct: 0,
    explanation: 'Nước cốt dừa làm vỏ bánh xèo béo ngậy thơm nức, thêm bột nghệ cho màu vàng giòn bắt mắt.',
  },
  {
    question: 'Món Nem Nướng Nha Trang ăn kèm với loại nước chấm sền sệt màu cam nấu từ gì?',
    options: ['Gạo nếp, Gan heo, Tôm xay & Tương đậu', 'Tương ớt đóng chai', 'Nước tương tỏi ớt', 'Sốt phô mai cay'],
    correct: 0,
    explanation: 'Nước sốt nem nướng Nha Trang sánh mịn béo bùi từ nếp xay nhuyễn nấu cùng gan heo và tôm thịt.',
  },
  {
    question: 'Gỏi Bưởi Tân Triều trứ danh được chế biến từ giống bưởi đường lá cam của tỉnh nào?',
    options: ['Đồng Nai', 'Bình Dương', 'Bình Phước', 'Tây Ninh'],
    correct: 0,
    explanation: 'Làng bưởi Tân Triều (Vĩnh Cửu, Đồng Nai) trù phú bên sông Đồng Nai cho trái bưởi mọng nước ngọt thanh.',
  },
  {
    question: 'Món Cốm Làng Vòng nức tiếng của Hà Nội được làm từ loại lúa nếp nào thơm ngon nhất?',
    options: ['Nếp Cái Hoa Vàng khi còn ngậm sữa', 'Lúa tẻ Khang Dân', 'Lúa mì mùa đông', 'Lúa rẫy khô cằn'],
    correct: 0,
    explanation: 'Hạt thóc nếp cái hoa vàng bấm ra sữa trắng ngần được rang sấy và giã sàng tỉ mỉ tạo nên hạt cốm dẻo thơm.',
  },
  {
    question: 'Bún Riêu Cua truyền thống sử dụng loại cua nào giã nhuyễn lọc lấy gạch ngọt đậm?',
    options: ['Cua Đồng sông nước ngọt', 'Cua Cà Mau biển mặn', 'Cua Hoàng đế Alaska', 'Cua Huỳnh đế đỏ'],
    correct: 0,
    explanation: 'Cua đồng nhỏ nhắn béo ngậy giã tay tạo mảng riêu cua bồng bềnh ngọt lịm tự nhiên.',
  },
  {
    question: 'Món Dê Núi Ninh Bình nổi tiếng thơm ngon, thịt săn chắc vì đàn dê được chăn thả ở đâu?',
    options: ['Thả rông leo trèo trên núi đá vôi', 'Nuôi nhốt chuồng công nghiệp', 'Thả trên bãi cát ven biển', 'Nuôi trong nhà kính'],
    correct: 0,
    explanation: 'Dê leo trèo vách núi đá vôi ăn lá cây thuốc tự nhiên giúp thịt săn chắc, thơm và không bị hôi.',
  },
];

// ========================================================
// TIER 3: CÂU HỎI HÓC BÚA / ĐỈNH CAO (MỐC 11 - 15) - 50 CÂU
// ========================================================
export const TIER3_HARD_QUESTIONS = [
  {
    question: 'Gia vị "Nhụy Hoa Nghệ Tây" (Saffron) đắt đỏ bậc nhất thế giới cần thu hoạch thủ công khoảng bao nhiêu bông hoa để được 1 kg?',
    options: ['Khoảng 150.000 đến 200.000 bông hoa', 'Khoảng 5.000 bông hoa', 'Khoảng 10.000 bông hoa', 'Khoảng 50.000 bông hoa'],
    correct: 0,
    explanation: 'Mỗi bông hoa nghệ tây chỉ có đúng 3 sợi nhụy manh mai, cần hàng trăm ngàn bông thu hoạch bằng tay tỉ mỉ.',
  },
  {
    question: 'Món "Yến Sào tiến vua" khai thác từ tổ của loài chim yến nào làm hoàn toàn bằng nước bọt?',
    options: ['Yến Hàng (Aerodramus fuciphagus)', 'Yến Cỏ bay đồng', 'Chim Én nhà', 'Chim Bồ Câu trắng'],
    correct: 0,
    explanation: 'Tổ yến hàng đảo yến thiên nhiên làm 100% từ tuyến nước bọt của chim yến đảo giàu vi chất quý hiếm.',
  },
  {
    question: 'Nước mắm truyền thống Việt Nam đạt chuẩn có hàm lượng đạm tự nhiên tối đa nguyên chất khoảng bao nhiêu độ đạm (N)?',
    options: ['Khoảng 40 đến 45 độ đạm tự nhiên', 'Lên tới 100 độ đạm tự nhiên', 'Khoảng 15 độ đạm', 'Chỉ 5 độ đạm'],
    correct: 0,
    explanation: 'Đạm tự nhiên từ cá cơm ủ chượp truyền thống tối đa đạt 40-45 độ đạm, các độ đạm cao hơn phải cô đặc chân không.',
  },
  {
    question: 'Món Chè Bột Lọc Heo Quay độc nhất vô nhị xứ Huế ra đời dưới triều đại vua nào của nhà Nguyễn?',
    options: ['Thời các Vua nhà Nguyễn thế kỷ 19', 'Thời Vua Lê Lợi', 'Thời Vua Hùng Vương', 'Thời Vua Quang Trung'],
    correct: 0,
    explanation: 'Món chè kết hợp vị ngọt của đường phèn gừng với nhân thịt heo quay mặn giòn là đỉnh cao ẩm thực cung đình Huế.',
  },
  {
    question: 'Loại gạo nào của Việt Nam xuất sắc giành danh hiệu "Gạo ngon nhất thế giới" tại World’s Best Rice năm 2019 và 2023?',
    options: ['Gạo ST25 của kỹ sư Hồ Quang Cua', 'Gạo Nàng Thơm Chợ Đào', 'Gạo Tám Xoan Hải Hậu', 'Gạo Séng Cù Lào Cai'],
    correct: 0,
    explanation: 'Giống lúa thơm ST25 do nhóm kỹ sư Hồ Quang Cua lai tạo tại Sóc Trăng 2 lần vô địch thế giới.',
  },
  {
    question: 'Cà Cuống - loài côn trùng tạo ra tinh dầu hương quế cay nồng quý hiếm có tinh dầu nằm ở bộ phận nào?',
    options: ['Hai túi tinh dầu nhỏ ở ngực con đực', 'Dưới cánh con cái', 'Trong đầu nhọn', 'Ở đốt đuôi sau'],
    correct: 0,
    explanation: 'Chỉ có con cà cuống đực mới sở hữu 2 túi tinh dầu xạ thơm lừng để thu hút con cái.',
  },
  {
    question: 'Bánh Gai cổ truyền Ninh Giang (Hải Dương) dùng loại mỡ heo nào để ướp đường làm nhân trong suốt giòn sần sật?',
    options: ['Mỡ phần (Mỡ gáy heo) thái hạt lựu', 'Mỡ sa mỏng dính', 'Mỡ lá rán chảy', 'Thịt nạc vai xay'],
    correct: 0,
    explanation: 'Mỡ gáy heo thái nhỏ luộc sơ rồi ướp đường trắng nhiều ngày cho đến khi mỡ trong suốt như pha lê.',
  },
  {
    question: 'Loại nấm quý hiếm bậc nhất Việt Nam chỉ mọc quanh tổ mối sâu dưới lòng đất vào đầu mùa mưa là nấm gì?',
    options: ['Nấm Mối tự nhiên', 'Nấm Kim Châm', 'Nấm Đùi Gà', 'Nấm Bào Ngư xám'],
    correct: 0,
    explanation: 'Nấm mối chỉ sinh trưởng từ chất thải men đặc biệt trong tổ loài mối đất, chưa thể nhân tạo.',
  },
  {
    question: 'Bảo tàng Bánh Mì đầu tiên của Việt Nam vinh danh văn hóa ẩm thực đường phố được khai trương tại thành phố nào?',
    options: ['TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Hội An'],
    correct: 0,
    explanation: 'Bảo tàng Bánh Mì tái hiện hành trình từ bánh mì baguette Pháp đến ổ bánh mì kẹp Việt Nam huyền thoại.',
  },
  {
    question: 'Món Pa Pỉnh Tộp chuẩn người Thái Đen phải nướng bằng que kẹp làm từ cây gì để không ám mùi khét?',
    options: ['Thanh tre bương hoặc nứa bánh tẻ tươi', 'Thanh sắt rỉ sét', 'Ống nhựa dẻo', 'Thanh gỗ thông nhiều dầu'],
    correct: 0,
    explanation: 'Kẹp tre bánh tẻ tươi khi nướng trên than giữ nước ngọt của cá và tỏa mùi thơm thảo mộc.',
  },
  {
    question: 'Loài Ốc Vú Nàng - hải sản quý hiếm chỉ có ở Côn Đảo và Cù Lao Chàm có hình dáng giống gì?',
    options: ['Hình chóp nón tựa bầu ngực thiếu nữ', 'Hình xoắn ốc tròn dẹt', 'Hình vuông vức sắc cạnh', 'Hình chiếc lá dài'],
    correct: 0,
    explanation: 'Vỏ ốc hình chóp nón đỉnh nhọn núm hồng tựa vú thiếu nữ, thịt giòn ngọt đậm đà khó sánh.',
  },
  {
    question: 'Rượu Sâm Ngọc Linh - quốc bảo thảo dược Việt Nam được ngâm từ củ sâm mọc ở độ cao trên bao nhiêu mét?',
    options: ['Trên 1.800m - 2.500m núi Ngọc Linh', 'Ở độ cao 200m dưới biển', 'Ở đồng bằng sông Hồng', 'Trong rừng cao su'],
    correct: 0,
    explanation: 'Sâm Ngọc Linh sinh trưởng dưới tán rừng già nguyên sinh đỉnh Ngọc Linh giữa Kon Tum và Quảng Nam.',
  },
  {
    question: 'Cá Anh Vũ - loài cá tiến vua huyền thoại ở ngã ba sông Bạch Hạc (Phú Thọ) ăn thức ăn gì để tích tụ khối sụn môi quý?',
    options: ['Rêu xanh bám trên đá ngầm đáy sông', 'Tôm tép phù du', 'Lá ngô khô nổi', 'Côn trùng bay'],
    correct: 0,
    explanation: 'Cá Anh Vũ dùng môi dày gặm rêu đá xiết cuồn cuộn làm phần sụn môi giòn béo vô song.',
  },
  {
    question: 'Món Bánh Cooc Mò (bánh sừng bò) dẻo quánh gói nếp nương của người Tày không có nhân mà chấm với gì?',
    options: ['Mật mía hoặc đường hoa mai', 'Nước mắm cá cơm', 'Tương ớt cay', 'Dầu mè đen'],
    correct: 0,
    explanation: 'Bánh sừng bò Cooc Mò thơm mùi nếp nương thuần khiết chấm mật mía ngọt lịm tan chảy nơi đầu lưỡi.',
  },
  {
    question: 'Gà Đông Tảo (Hưng Yên) tiến vua nổi tiếng với bộ phận nào phát triển khổng lồ xù xì màu đỏ rực?',
    options: ['Đôi chân to bọc vảy thịt xù xì', 'Chiếc mỏ quặp đại bàng', 'Đôi cánh dài quét đất', 'Chiếc mào hình vương miện'],
    correct: 0,
    explanation: 'Đôi chân to bản vảy thịt đỏ rực như rồng là đặc điểm di truyền độc nhất của gà Đông Tảo.',
  },
  {
    question: "Món Thắng Cố nguyên bản của đồng bào H'Mông Tây Bắc nấu từ thịt và lục phủ ngũ tạng của con vật nào?",
    options: ['Con Ngựa (Ngựa đồi vùng cao)', 'Con Bò sữa Hà Lan', 'Con Dê bách thảo', 'Con Hươu sao'],
    correct: 0,
    explanation: 'Thắng cố ngựa ninh cùng 12 loại thảo mộc (hạt dổi, quế, thảo quả) trong chảo gang khổng lồ.',
  },
  {
    question: 'Cây Sâm Bố Chính từng là cống vật tiến vua triều Nguyễn có xuất xứ địa danh lịch sử ở tỉnh nào?',
    options: ['Quảng Bình (Châu Bố Chính xưa)', 'Thừa Thiên Huế', 'Quảng Nam', 'Nghệ An'],
    correct: 0,
    explanation: 'Châu Bố Chính (nay thuộc Bố Trạch, Quảng Bình) là vùng đất phát tích cây sâm quý bồi bổ long thể.',
  },
  {
    question: 'Món "Sá Sùng" (Địa sâm) nướng giòn ngọt nước dùng phở xưa của Hà Nội có giá trị dinh dưỡng cao được bắt ở đâu?',
    options: ['Bãi cát bồi ven biển Quan Lạn (Quảng Ninh)', 'Đỉnh núi Fansipan', 'Rừng ngập mặn Cần Giờ', 'Đáy hồ Tây Hà Nội'],
    correct: 0,
    explanation: 'Sá sùng Quan Lạn đào sâu dưới bãi cát biển, chỉ một nhánh nhỏ nướng thả vào nồi nước dùng phở ngọt sâu tự nhiên.',
  },
  {
    question: 'Nước mắm Gành Đỏ nức tiếng với phương pháp ủ chượp truyền thống hơn 100 năm là đặc sản của tỉnh nào?',
    options: ['Phú Yên (Thị xã Sông Cầu)', 'Bình Định', 'Quảng Ngãi', 'Khánh Hòa'],
    correct: 0,
    explanation: 'Làng nghề Gành Đỏ nằm bên vịnh Xuân Đài, Phú Yên nổi tiếng với những giọt mắm cá cơm thơm thảo.',
  },
  {
    question: 'Trà Thiết Quan Âm trứ danh thuộc dòng trà nào trong nghệ thuật lên men trà?',
    options: ['Trà Ô Long bán lên men (Oolong)', 'Trà Xanh hoàn toàn không lên men', 'Trà Đen lên men toàn phần', 'Trà Phổ Nhĩ lên men vi sinh'],
    correct: 0,
    explanation: 'Thiết Quan Âm là danh trà Ô Long bán lên men nức tiếng với sắc nước vàng hổ phách và hương hoa lan quý phái.',
  },
  {
    question: 'Món Cơm Vắt cuốn lá lốt ăn với muối vừng từng theo chân nghĩa quân thời kỳ nào trong lịch sử Việt Nam?',
    options: ['Nghĩa quân Lam Sơn (Thời vua Lê Lợi)', 'Thời Ngô Quyền đánh Nam Hán', 'Thời Hai Bà Trưng', 'Thời Đinh Bộ Lĩnh'],
    correct: 0,
    explanation: 'Nắm cơm vắt lá lốt bền chắc, không thiu giúp nghĩa quân Lam Sơn vượt qua muôn ngàn hiểm trở đánh đuổi giặc Minh.',
  },
  {
    question: 'Nghệ thuật ẩm thực Cung đình Huế quy định một ngự yến đại tiệc thời các Vua chúa có bao nhiêu món ăn?',
    options: ['Lên tới 50 hoặc 66 món cao lương mỹ vị', 'Chỉ đúng 8 món', 'Đúng 12 món', '100 món'],
    correct: 0,
    explanation: 'Bữa đại yến cung đình Huế có từ 50 đến 66 món ăn cầu kỳ bát trân bài trí như những tác phẩm điêu khắc nghệ thuật.',
  },
  {
    question: 'Rượu Cần của đồng bào Tây Nguyên được lên men từ gạo nếp nương và men lá rừng ủ trong dụng cụ gì?',
    options: ['Ché sành cổ hoa văn rồng phượng', 'Thùng gỗ sồi nhập khẩu', 'Can nhựa công nghiệp', 'Vỏ quả bầu khô'],
    correct: 0,
    explanation: 'Rượu cần ủ trong ché sành đất nung, khi uống cắm những chiếc cần trúc dài hút chung thể hiện tình đoàn kết buôn làng.',
  },
  {
    question: 'Loại hạt tiêu đắt nhất thế giới "Tiêu Sọ Phú Quốc" được làm từ quả tiêu chín đỏ như thế nào?',
    options: ['Tiêu chín đỏ ngâm nước chà sạch vỏ đen lấy hạt trắng ngà', 'Nướng cháy đen xì', 'Nghiền sống phơi nắng', 'Ép lấy tinh dầu'],
    correct: 0,
    explanation: 'Tiêu sọ chắt lọc từ những hạt tiêu chín đỏ mọng nhất, ngâm nước bóc vỏ ngoài giữ trọn vẹn lõi cay nồng nàn.',
  },
  {
    question: 'Món Nem Công Chả Phượng đứng đầu danh sách "Bát Trân" cung đình ngày xưa có tạo hình hình chim phượng từ củ gì?',
    options: ['Củ Cà rốt & Củ cải trắng tỉa hoa nghệ thuật', 'Củ Khoai lang luộc', 'Củ Sắn dây', 'Củ Hành tây'],
    correct: 0,
    explanation: 'Đầu phượng đài các tỉa từ củ cà rốt, củ sen làm mình phượng và chả lụa uốn lượn như cánh chim kiêu sa.',
  },
  {
    question: 'Bánh Đậu Xanh Hải Dương tiến vua ra đời vào khoảng thế kỷ 19 dưới triều vua nào đã ban khen sắc phong rồng?',
    options: ['Vua Bảo Đại (Khen tặng huy hiệu rồng vàng)', 'Vua Gia Long', 'Vua Minh Mạng', 'Vua Tự Đức'],
    correct: 0,
    explanation: 'Vua Bảo Đại sau khi nếm thử bánh đậu xanh Hải Dương đã hết lời khen ngợi và ban sắc lệnh in hình rồng vàng.',
  },
  {
    question: 'Quả Mắc Mật (Móc mật) mọc hoang dại trên núi đá vôi Đông Bắc mang ý nghĩa tên gọi theo tiếng Tày là gì?',
    options: ['Quả Ngọt Ngào như Mật Ong', 'Quả Đắng Cay cuộc đời', 'Quả Chua như giấm', 'Quả Rơi rụng mùa thu'],
    correct: 0,
    explanation: 'Theo tiếng Tày - Nùng, "mác mật" có nghĩa là quả ngọt ngào, tinh dầu lá thơm nức dùng quay vịt Lạng Sơn.',
  },
  {
    question: 'Món Bún Quậy Phú Quốc nức tiếng đòi hỏi thực khách phải tự tay làm việc gì khi chờ lấy tô bún?',
    options: ['Tự quậy bát nước chấm theo khẩu vị riêng (quất, ớt, đường, muối)', 'Tự đi vo gạo tráng bún', 'Tự đi múc nước lèo', 'Tự chiên chả cá'],
    correct: 0,
    explanation: 'Quầy gia vị với quất, ớt, muối, đường cho thực khách tự do "quậy" nên bát nước chấm độc bản theo ý mình.',
  },
  {
    question: 'Làng gốm Bát Tràng (Hà Nội) nổi tiếng cung cấp loại lu sành nung củi chuyên biệt cho việc ủ loại nước mắm nào?',
    options: ['Nước mắm nhỉ truyền thống tiến vua', 'Nước tương đen', 'Rượu vang nho', 'Giấm táo mèo'],
    correct: 0,
    explanation: 'Lu sành Bát Tràng tráng men da lươn giữ nhiệt độ ổn định giúp mắm cá phân giải đạm tự nhiên tối ưu.',
  },
  {
    question: 'Hạt Dổi rừng Tây Bắc - vàng đen của núi rừng khi nướng trên than hồng sẽ phát ra âm thanh gì?',
    options: ['Nổ lép bép tí tách và phồng căng tròn', 'Bốc khói đen kịt', 'Chảy nước mật ngọt', 'Tan biến thành tro'],
    correct: 0,
    explanation: 'Hạt dổi khi nướng chín tới trên than hồng sẽ phồng to, tỏa ra mùi thơm thảo mộc quý phái ngây ngất.',
  },
  {
    question: 'Món Bánh Tro (Bánh Ú tro) chấm mật mía trong tết Đoan Ngọ dùng nước tro ngâm gạo nếp đốt từ cây gì tốt nhất?',
    options: ['Cây Đỗ tương (đậu nành) hoặc cây Dền gai phơi khô', 'Cây Thông nhiều nhựa', 'Than tổ ong', 'Cây Bạch đàn'],
    correct: 0,
    explanation: 'Tro cây dền gai và rơm rạ sạch tạo nước vôi trong màu vàng hổ phách trong suốt cho bánh tro dẻo mềm thanh mát.',
  },
  {
    question: 'Đặc sản Cà Xỉu muối giòn rụm với chiếc vòi dài thò ra ngoài là món ăn độc lạ của vùng biển nào?',
    options: ['Hà Tiên (Kiên Giang)', 'Vũng Tàu', 'Móng Cái', 'Phan Rang'],
    correct: 0,
    explanation: 'Cà xỉu sống vùi mình dưới lớp bùn đầm lầy Hà Tiên, vòi giòn sần sật muối chua cay là mồi nhắm trứ danh.',
  },
  {
    question: 'Cá Hồi Sa Pa (Lào Cai) nuôi thành công nhờ nguồn nước lạnh tự nhiên bắt nguồn từ dãy núi nào?',
    options: ['Dãy Hoàng Liên Sơn hùng vĩ', 'Dãy Trường Sơn Bắc', 'Dãy Bạch Mã', 'Dãy Tam Đảo'],
    correct: 0,
    explanation: 'Nước suối nguồn tinh khiết dưới chân đỉnh Fansipan nhiệt độ dưới 15 độ C lý tưởng cho cá hồi vân sinh trưởng.',
  },
  {
    question: 'Món Gỏi Nhệch Nga Sơn (Thanh Hóa) cầu kỳ cuốn với hơn 10 loại lá rừng chấm cùng loại chẻo nấu từ gì?',
    options: ['Xương cá nhệch giã nhuyễn nấu mẻ chua, mỡ hàn & ớt', 'Nước mắm tỏi ớt loãng', 'Tương bần xay', 'Nước sốt cà chua'],
    correct: 0,
    explanation: 'Nước chẻo nhệch béo ngậy nấu từ xương cá nhệch xay nhỏ ninh cùng mẻ chua là bí quyết tạo nên món gỏi thần thánh.',
  },
  {
    question: 'Món Heo Quay bánh hỏi xứ Lạng nổi tiếng bởi bụng heo được nhồi đầy lá gì trước khi khâu lại quay than?',
    options: ['Lá Mác Mật tươi & quả mác mật muối', 'Lá Chanh bánh tẻ', 'Lá Tía tô đỏ', 'Lá Ổi xanh'],
    correct: 0,
    explanation: 'Lá mác mật ngấm vào từng thớ thịt giúp thịt heo quay Lạng Sơn mềm thơm, da giòn bóng như gương soi.',
  },
  {
    question: 'Vùng chè Tân Cương nức tiếng "Đệ nhất danh trà" của tỉnh Thái Nguyên nằm bên dòng sông thơ mộng nào?',
    options: ['Sông Công', 'Sông Hồng', 'Sông Lô', 'Sông Đà'],
    correct: 0,
    explanation: 'Đất phù sa sông Công cùng tiểu khí hậu chân dãy Tam Đảo tạo nên hương cốm non ngọt hậu của chè Tân Cương.',
  },
  {
    question: 'Món Bánh Mì Cay Hải Phòng truyền thống chỉ kẹp đúng một loại nhân duy nhất nào bên trong?',
    options: ['Pate gan heo béo ngậy chấm chí chương (tương ớt)', 'Thịt bò xào ớt chuông', 'Trứng chiên hành lá', 'Cá nục kho dừa'],
    correct: 0,
    explanation: 'Chiếc bánh mì cay tí hon chỉ kẹp lớp pate gan mịn màng, chấm nước tương ớt chí chương gia truyền cay tê đầu lưỡi.',
  },
  {
    question: 'Thịt Nhím rừng hoặc Nhím nuôi theo kinh nghiệm dân gian không nên nấu chung với loại rau nào?',
    options: ['Rau Cải bó xôi (Cải bina)', 'Rau Mùi tàu', 'Rau Ngổ thơm', 'Rau Cần tây'],
    correct: 0,
    explanation: 'Theo kinh nghiệm ẩm thực dân gian, thịt nhím kỵ với một số loại rau có tính hàn mạnh gây đầy bụng.',
  },
  {
    question: 'Món Bánh Tày (Bánh Tày Liêm) gói nếp dẻo nhân đậu xanh của đồng bào Tày thường dùng trong dịp lễ nào?',
    options: ['Lễ Lồng Tồng (Lễ xuống đồng đầu xuân)', 'Tết Đoan Ngọ', 'Lễ Vu Lan', 'Lễ hội Halloween'],
    correct: 0,
    explanation: 'Bánh tày hình tròn dài dâng cúng thần nông cầu mưa thuận gió hòa trong lễ hội Lồng Tồng đầu năm.',
  },
  {
    question: 'Chè Shan Tuyết Tà Xùa (Bắc Yên, Sơn La) nổi tiếng bởi búp trà có lớp lông tơ màu gì bao phủ?',
    options: ['Lớp lông tơ Trắng Bạc mịn màng như tuyết', 'Lớp lông tơ Vàng óng', 'Lớp lông Đen nhánh', 'Lớp gai nhọn đỏ'],
    correct: 0,
    explanation: 'Sương muối và mây mù bao phủ quanh năm giúp búp chè Tà Xùa đọng lớp lông tuyết trắng muốt giàu khoáng chất.',
  },
  {
    question: 'Món Canh Chua Cá Linh Bông Điên Điển là bản giao hưởng ẩm thực mùa nào ở miền Tây Nam Bộ?',
    options: ['Mùa Nước Nổi (Khoảng tháng 8 - tháng 11 âm lịch)', 'Mùa Hạn hán mùa khô', 'Mùa Đông lạnh giá', 'Mùa Gặt lúa đông xuân'],
    correct: 0,
    explanation: 'Khi con nước son từ thượng nguồn Mekong đổ về mang theo đàn cá linh non và hoa điên điển vàng rực bờ kênh.',
  },
  {
    question: 'Nước dừa sáp Cầu Kè (Trà Vinh) đặc quánh cơm dừa dẻo dày, chỉ chiếm tỷ lệ khoảng bao nhiêu trong một quầy dừa?',
    options: ['Chỉ khoảng 20% đến 30% số trái trong buồng', '100% tất cả các trái', '50% nửa buồng', 'Hiếm tới mức 1%'],
    correct: 0,
    explanation: 'Dù cùng một cây dừa sáp, mỗi quầy chỉ cho vài trái sáp đặc ruột dẻo quánh tự nhiên, số còn lại là dừa nước bình thường.',
  },
  {
    question: 'Món Bánh Pía Sóc Trăng cổ truyền ngày xưa có in dấu mộc đỏ chữ Hán gì trên mặt bánh?',
    options: ['Chữ "Phúc" (福) hoặc tên lò bánh gia truyền', 'Chữ "Tài"', 'Chữ "Nhẫn"', 'Hình con rồng'],
    correct: 0,
    explanation: 'Con dấu mộc đỏ son in chữ Phúc tượng trưng cho lời chúc bình an và may mắn đến gia đình người thưởng thức.',
  },
  {
    question: 'Loại ớt xiêm rừng tí hon cay thơm nồng nàn mọc hoang dã ở vùng đất bazan miền Trung còn có tên gọi là gì?',
    options: ['Ớt Bay hoặc Ớt Chỉ Địa rừng', 'Ớt Sừng trâu khổng lồ', 'Ớt Đà Lạt ngọt', 'Ớt Bột paprika'],
    correct: 0,
    explanation: 'Ớt xiêm rừng quả bé bằng đầu đũa do chim ăn phát tán hạt khắp rừng núi, cay nồng mà không hăng gắt.',
  },
  {
    question: 'Món Bánh Ít Lá Gai Bình Định muốn vỏ bánh dẻo mịn đen bóng thì người thợ phải giã cối trong bao lâu?',
    options: ['Giã liên tục hàng giờ liền bằng cối đá bằng sức trai tráng', 'Chỉ cần đảo 1 phút', 'Dùng máy xay sinh tố 5 giây', 'Để tự lên men không cần giã'],
    correct: 0,
    explanation: 'Nếp thơm ngào đường và lá gai luộc phải quết chày đôi nhịp nhàng hàng giờ trên cối đá mới đạt độ dẻo quánh thượng thừa.',
  },
  {
    question: 'Món Chả Mực Hạ Long giã tay nổi tiếng giòn sần sật phải chọn con mực nào tươi ngon nhất?',
    options: ['Mực Mai nang dày còn sống nhấp nháy ánh kim', 'Mực Ống ươn đông lạnh', 'Mực Sim tí hon', 'Mực Khô nướng than'],
    correct: 0,
    explanation: 'Mực mai nang dày mình vớt từ vịnh Hạ Long giã bằng cối đá thủ công tạo nên độ giòn sần sật đỉnh cao.',
  },
  {
    question: 'Rau Tiến Vua (Rau Câu khô) ngày xưa dùng làm gỏi cống nạp cung đình thực chất là loài rau gì?',
    options: ['Cây Rau Diếp tiến vua phơi khô giòn', 'Rong biển bám đá', 'Rau muống chẻ ngọn', 'Rau câu ngâm giấm'],
    correct: 0,
    explanation: 'Rau tiến vua là phần thân giòn sần sật của một loài thực vật họ cúc, phơi khô ngâm nước nở xanh giòn rụm.',
  },
  {
    question: 'Món Bún Bò Cay Bạc Liêu có màu đỏ cam rực lửa của ớt sừng và vị thơm nồng từ loại gia vị nào?',
    options: ['Bột nghệ & Quả hồi quế chi', 'Bột ca cao đen', 'Mù tạt wasabi cay', 'Sốt mayonnaise trắng'],
    correct: 0,
    explanation: 'Bún bò cay Bạc Liêu nấu bắp bò hầm mềm trong nước dùng sả ớt bột nghệ cay xé lưỡi ấm nồng phương Nam.',
  },
  {
    question: 'Bánh Gai Cầu Vồng hay Bánh Ngũ Sắc dâng cúng tổ tiên của người Tày nhuộm 5 màu hoàn toàn từ đâu?',
    options: ['Các loại lá cây rừng tự nhiên (Lá cẩm tím, nghệ vàng, lá nếp...)', 'Phẩm màu công nghiệp hóa học', 'Sơn nước tổng hợp', 'Mực viết học sinh'],
    correct: 0,
    explanation: 'Màu tím lá cẩm, màu đỏ quả gấc, màu vàng củ nghệ, màu xanh lá dứa hòa quyện tạo nên mâm xôi bánh ngũ sắc linh thiêng.',
  },
  {
    question: 'Món Lẩu Gà Lá É nức tiếng Đà Lạt có hương vị lá é tinh dầu thơm nồng thực chất là phân loài của loại cây nào?',
    options: ['Cây Húng Quế trắng (Hương nhu trắng)', 'Cây Bạc hà đá', 'Cây Xương sông rừng', 'Cây Kinh giới đỏ'],
    correct: 0,
    explanation: 'Lá é là một phân loài của húng quế trắng, khi vò nát tỏa mùi thơm the mát vị hơi chua cay ấm nồng.',
  },
];

/**
 * Lấy câu hỏi dự phòng phân tầng theo cấp độ ván đấu (1 - 15)
 * @param {number} level Cấp độ câu hỏi (1 -> 15)
 * @param {Set<string>} usedQuestionsSet Tập hợp các câu hỏi đã dùng để chống trùng lặp
 */
export function getTieredFallbackQuestion(level = 1, usedQuestionsSet = new Set()) {
  let pool = TIER1_EASY_QUESTIONS;

  if (level > 10) {
    pool = TIER3_HARD_QUESTIONS;
  } else if (level > 5) {
    pool = TIER2_MEDIUM_QUESTIONS;
  }

  // Lọc các câu chưa từng xuất hiện trong Set câu đã dùng
  const available = pool.filter((q) => {
    const clean = (q.question || '').trim().toLowerCase();
    return !usedQuestionsSet.has(clean);
  });

  // Nếu trong tier còn câu chưa dùng -> chọn ngẫu nhiên 1 câu
  if (available.length > 0) {
    const picked = available[Math.floor(Math.random() * available.length)];
    return { ...picked, level };
  }

  // Nếu đã dùng hết toàn bộ tier (rất hiếm vì có tới 50 câu cho 5 mốc), fallback lấy câu ngẫu nhiên
  const fallbackPicked = pool[Math.floor(Math.random() * pool.length)];
  return { ...fallbackPicked, level };
}
