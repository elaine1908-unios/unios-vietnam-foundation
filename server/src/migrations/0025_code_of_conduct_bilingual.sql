-- Split Code of Conduct sections into separate English/Vietnamese content,
-- and remove the Acknowledgement Form section per request.
ALTER TABLE code_of_conduct_sections ADD COLUMN content_en TEXT NOT NULL DEFAULT '';
ALTER TABLE code_of_conduct_sections ADD COLUMN content_vi TEXT NOT NULL DEFAULT '';

UPDATE code_of_conduct_sections SET content_en = '<h4>1.1 Welcome</h4>
<p>Unios Vietnam (“the Employer”) would like to wish you every success during your employment, whether you recently joined or whether you are an existing employee. It is hoped that your experience of working with us is positive and rewarding.</p>
<h4>1.2 Purpose of the Code of Conduct</h4>
<p>The Code of Conduct sets out the Employer’s rules and regulations, the policies and procedures relating to your employment and also contains information on your benefits and protections. If you require any clarification or additional information, please speak to your manager. All employees are required to comply with the Code of Conduct. Therefore, we ask that you read the content carefully as you may be subject to appropriate disciplinary action (up to and including termination) in the event that you breach the Code of Conduct.</p>
<h4>1.3 Principle of Equality</h4>
<p>The Employer is committed to providing equal opportunities and the principle of equality in accordance with relevant legislative provisions. We are confident that you share our commitment in implementing these policies. We will not tolerate any unlawful discriminatory act or attitude in the course of your employment or in your dealings with our clients, suppliers, contractors, members of the public or fellow colleagues. Acts of unlawful discrimination, harassment or victimisation will result in disciplinary action.</p>
<h4>1.4 General</h4>
<p>Amendments to this Code of Conduct will be issued from time to time. It does not form part of your contract of employment, unless expressly stated otherwise. However, in any event, the Code of Conduct may be considered when interpreting your rights and obligations under your terms of employment.</p>', content_vi = '<h4>1.1 Lời nói đầu</h4>
<p>Unios Vietnam (“công ty”) mong muốn bạn sẽ thành công trên con đường sự nghiệp bạn đã lựa chọn với công ty. Cho dù bạn là nhân viên mới hay đang làm việc lại Unios Vietnam, công ty hy vọng khoảng thời gian bạn dành tại Unios Vietnam mỗi ngày sẽ mang đến cho bạn những kinh nghiệm bổ ích và tích cực trong cuộc sống.</p>
<h4>1.2 Mục đích của tài liệu này</h4>
<p>Tài liệu này là chính sách và quy định, quy tắc do công ty đặt ra để trong quá trình làm việc để bảo vệ cho lợi ích của bạn. Nếu bạn chưa rõ hoặc muốn bổ sung những thông tin nào, vui lòng liên hệ với cấp trên hoặc quản lý của mình. Tất cả các nhân viên đều được yêu cầu tuân thủ theo những quy tắc này. Vì thế, công ty hy vọng bạn sẽ đọc kỹ nội dung và nghiêm túc chấp hành. Mọi vi phạm sẽ phải chịu hình thức kỷ luật thích hợp, tối đa có thể buộc thôi việc.</p>
<h4>1.3 Nguyên tắc bình đẳng</h4>
<p>Unios Vietnam cam kết cung cấp cho bạn một môi trường làm với các cơ hội và nguyên tắc bình đẳng theo quy định đã đưa ra. Công ty tin vào sự cam kết của bạn trong việc thực hiện những điều này. Đồng thời, công ty sẽ không tha thứ cho bất kỳ hành vi bất hợp pháp hoặc thái độ phân biệt đối xử đối với khách hàng, nhà thầu, nhà cung cấp và cả đồng nghiệp. Các hành vi trái pháp luật, bất bình đẳng, quấy rối hoặc đóng vai nạn nhân sẽ dẫn đến những hình thức kỷ luật thích hợp hoặc buộc thôi việc.</p>
<h4>1.4 Vấn đề chung</h4>
<p>Bản quy tắc ứng xử này sẽ được thay đổi theo thời gian, và không phải là một phần trong hợp đồng lao động của bạn, trừ khi có phụ lục khác. Tuy nhiên, trong tất cả các trường hợp, bản quy tắc ứng xử này sẽ được xem xét khi đàm phán về quyền và nghĩa vụ của bạn trong thoả thuận các điều khoản hợp đồng.</p>
<p>Date / Ngày Version Signature / Ký tên</p>' WHERE id = '439ee39f-28ae-4e0a-afae-824cfc61cc0e';
UPDATE code_of_conduct_sections SET content_en = '<h4>2.1 Probationary Period</h4>
<p>The length of your probationary period is set out in your contract of employment delivered to you on your first day of work. This contract is valid for the period agreed between the company and you. Casual employees are not subject to a probationary period. During this period, your work performance and general suitability will be assessed and, if it is satisfactory, your employment will continue. However, if your work performance is assessed as generally unsuitable, the Employer may either take remedial action (which may include the extension of your probationary period) or terminate your employment at any time prior to confirmation of your employment. Your probationery result will be elvaluated by your line manager after this 2 months.</p>
<h4>2.2 Employee Training & Training Agreement</h4>
<p>The Company will provide you with training programs tailored to your specific role. These programs include fundamental knowledge required for your job as well as the procedures for carrying out relevant tasks. You are required to fully participate in and comply with the processes and guidelines provided during the training. Once your capability has been demonstrated and you meet the criteria for career advancement, you will be required to undertake advanced training programs necessary for your new position. In the event that you wish to participate in additional training programs beyond those provided by the Company, you may submit a Training Request Form  and enter into a Training Agreement . The Company will review the validity and relevance of the proposed training and may decide to contribute partially or fully to the training costs. However, if you unilaterally terminate your employment contract or your employment is terminated for any reason, the Company reserves the right to seek reimbursement of such training costs. Further details will be specified in the training agreement documentation.</p>
<h4>2.3 Job Description</h4>
<p>You may be provided with a job description to help illustrate your role. Amendments may be made to your job description from time to time in relation to the Employer’s changing needs and your own ability.</p>
<h4>2.4 Job Flexibility & Mobility</h4>
<p>Whenever necessary, you will transfer to alternative duties within the Employer’s business. During holiday periods, for example, it may be necessary for you to take over duties normally performed by colleagues. This flexibility is essential for operational efficiency as the type and volume of work is always subject to change. It is a condition of your employment that you are prepared, whenever applicable, to travel to any other of our sites or client sites within a reasonable travelling distance. This mobility is essential to the smooth running of the business.</p>
<h4>2.5 Convictions and Offences</h4>
<p>During your employment, you are required to immediately report to the Employer any convictions or offences with which you may be potentially or have been charged.</p>', content_vi = '<h4>2.1 Thời gian thử việc</h4>
<p>Thời gian thử việc sẽ được quy định rõ trong hợp đồng lao động được gửi đến bạn trong ngày đầu tiên nhận việc. Hợp đồng này có giá trị pháp lý trong thời gian thoả thuận giữa công ty và bạn. Trong trường hợp bạn là nhân viên thời vụ, bạn sẽ không trải qua giai đoạn thử việc này. Trong thời gian thử việc, hiệu suất công việc và sự thích nghi của bạn với môi trường làm việc mới sẽ được đánh giá. Nếu phù hợp với tiêu chí và các giá trị cốt lõi của công ty, bạn sẽ bắt đầu công việc với tư cách là một nhân viên chính thức. Ngược lại, nếu không đạt những điều kiện trên, công ty sẽ có biện pháp khắc phục, có thể là gia hạn thời gian thử việc trước khi ký hợp đồng chính thức hoặc chấm dứt hợp đồng. Kết quả thử việc của bạn sẽ được quản lý trực tiếp đánh giá sau 2 tháng này.</p>
<h4>2.2 Thời gian và thoả thuận về khoá đào tạo</h4>
<p>Công ty sẽ cung cấp cho bạn một khoá đào tạo cho từng vị trí cụ thể. Khoá đào tạo này bao gồm các kiến thức căn bản trong công việc và các quy trình thực hiện các tác vụ này. Bạn được yêu cầu tham gia đầy đủ và thực hiện đúng theo những quy trình đã được hướng dẫn. Khi năng lực của bạn được chứng minh và đạt tiêu chuẩn thăng tiến trong công việc, bạn được yêu cầu tham gia những khoá đào tạo nâng cao và cần thiết cho vị trí mới. Trong trường hợp bạn có mong muốn được tham gia các khoá đào tạo để củng cố thêm kiến thức cho công việc nằm ngoài phạm vi công ty cung cấp, bạn có thể điền vào Training Request Form  và ký xác nhận vào cam kết Training Agreement . Công ty sẽ tiến hành xem xét tính xác thực của khoá đào tạo này và đưa ra quyết định đóng góp một phần hoặc toàn bộ vào chi phí đào tạo cho bạn. Tuy nhiên, nếu bạn đơn phương chấm dứt hợp đồng hoặc bị buộc thôi việc vì bất cứ lý do gì, công ty sẽ có biện pháp yêu cầu bạn hoàn trả lại chi phí này. Thông tin chi tiết sẽ được đính kèm trong biên bản tham gia khoá đào tạo.</p>
<h4>2.3 Mô tả công việc</h4>
<p>Bạn sẽ nhận được một bản mô tả công việc và tiêu chuẩn đánh giá chất lượng để giúp minh hoạ vai trò của bạn trong công ty. Theo thời gian, công ty sẽ có những thay đổi và cập nhật trong tài liệu này để phù hợp với nhu cầu của công ty và năng lực của bạn.</p>
<h4>2.4 Tính linh hoạt và chủ động trong công việc</h4>
<p>Bạn được yêu cầu tham gia vào các bộ phận khác của công ty trong trường hợp có người xin nghỉ phép. Tính linh hoạt này là giá trị cốt lõi cho hiệu quả hoạt động của công ty vì khối lượng công việc luôn thay đổi. Bạn được yêu cầu sẵn sàng bất cứ khi nào, đi đến công trường hoặc dự án trong phạm vi di chuyển và khung thời gian hợp lý. Tính chủ động này rất quan trọng trong việc vận hành trơn tru của doanh nghiệp.</p>
<h4>2.5 Lý lịch tư pháp</h4>
<p>Trong khoảng thời gian làm việc tại công ty, bạn được yêu cầu báo cáo ngay lập tức về những hành vi vi phạm pháp luật mà bạn đã hoặc đang có thể bị kết án hoặc buộc tội.</p>' WHERE id = 'ace3a56a-dc55-4805-aaac-76047da7b429';
UPDATE code_of_conduct_sections SET content_en = '<h4>3.1 Hours of work</h4>
<p>You may be rostered to work Monday to Friday. Currently, the usual business hours are 8.00am to 5.00pm. You’ll also have lunch break from 12:00 to 13:00, but these hours may change from time to time. You will be noticed in advance should these changes happen.</p>
<h4>3.2 Lateness | Absenteeism</h4>
<p>You are required to be present and ready to commence work at your rostered starting time. You must return to work following authorised breaks, punctually and at the time you are to resume work. In the event you are going to be late to work, or following an authorised break, you are required to notify your manager as soon as possible and indicate when you expect to arrive. All absences due to illness must be notified in accordance with the sickness reporting procedures set out in this Code of Conduct. Lateness or unauthorised absence may result in disciplinary action and/or loss of pay.</p>
<h4>3.3 Administration</h4>
<p><strong>i) Payment</strong></p>
<p>Your salary will be processed and transferred to you on a bi- weekly basis, on the 5th and 20th of each month. You will receive a detailed payslip outlining the total amount payable to you, including any deductions (such as taxes or other agreed contributions, for example insurance). If you have any queries regarding your payment, you are encouraged to contact your line manager. Your salary is considered confidential personal information and should not be disclosed to other employees. Salary payments will be initiated from the Company’s bank account on the 5th and 20th of each month. The actual receipt time may vary depending on the bank you use. In the event that these dates fall on a non-working day, the Company will process the payment either earlier or later depending on operational circumstances; however, any delay shall not exceed two (02) working days.</p>
<p><strong>ii) Overpayments</strong></p>
<p>If you are overpaid for any reason, the total amount of the overpayment will normally be deducted from your next payment or to be recovered over a longer period.</p>
<p><strong>iii) Tax</strong></p>
<p>At the end of each tax year you will be given a summary statement showing the total pay you have received during that year and the amount of deductions for tax and other matters. You should keep this document in a safe place as you may need to produce them for tax purposes.</p>
<p><strong>iv) Overtime</strong></p>
<p>Regarding the policy of working overtime, Unios Vietnam is currently implementing the following two forms:</p>
<ul><li>Overtime work organized and inquired by the Company</li></ul>
<p>based on employees’ opinions. After receiving approval from both parties, the overtime work (OT) will be compensated by the Company according to the regulations set by the State.</p>
<ul><li>Overtime hours should not exceed 40 hours per month,</li></ul>
<p>and 200 hours per year. You need to submit a request for overtime (OT) and obtain approval from your superiors before working overtime. Note: If this request is not acknowledged and signed, you will not receive overtime pay for that period of work. Additional working hours required to complete your daily tasks, in cases where you are unable to finish these tasks within regular working hours, will not be counted as overtime. At Unios Vietnam, the company does not encourage you to work overtime beyond what is necessary to ensure a balance between work and life, while also avoiding decreased productivity and work fatigue.</p>
<p><strong>v) Pay reviews</strong></p>
<p>Pay is reviewed annually in the end of the financial year (June). However, there is no guarantee of an increase in your pay as a result of any review.</p>
<p><strong>vi) Superannuation</strong></p>
<p>The company shall pay the insurance premium for employees under the Vietnam Labour Code. This includes Social insurance, Health insurance and Unemployment insurance and shall be calculated according to the basic salary specified in the Labour contract and the agreement between you and the Employer.</p>', content_vi = '<h4>3.1 Giờ làm việc</h4>
<p>Thời gian làm việc cố định của Unios Vietnam bắt đầu từ thứ 2 - thứ 6 (8:00 - 17:00). Bạn có thời gian nghỉ trưa 1 tiếng (12:00 - 13:00). Lịch làm việc có thể được thay đổi tuỳ theo tình hình hoạt động của công ty. Việc điều chỉnh này sẽ được thông báo trước tới bạn.</p>
<h4>3.2 Đi trễ  |  Nghỉ không phép</h4>
<p>Bạn được yêu cầu tuân thủ giờ làm việc, quay trở lại công ty sau khoảng thời gian nghỉ giải lao và ăn trưa vào đúng giờ quy định. Trong trường hợp bạn không thể đến đúng giờ vì lý do bất khả kháng, bạn được yêu cầu thông báo cho người quản lý ngay lập tức về lý do đi trễ và cho biết khi nào bạn sẽ có mặt. Tất cả các lý do vắng mặt do bệnh tật phải được thông báo dựa theo thủ tục về báo cáo bệnh tật được liệt kê trong cuốn quy tắc này. Đi trễ không có lý do chính đáng hoặc vắng mặt không phép sẽ bị xử lý kỷ luật thích hợp.</p>
<h4>3.3 Các phúc lợi dành cho bạn</h4>
<p><strong>i) Thanh toán lương</strong></p>
<p>Tiền lương của bạn sẽ được xử lý và chuyển đến bạn theo định kỳ hai (02) lần mỗi tháng, vào ngày 05 và ngày 20. Bạn sẽ nhận được bảng lương chi tiết, thể hiện tổng thu nhập và các khoản khấu trừ (bao gồm thuế và các khoản đã thỏa thuận với Công ty, ví dụ như bảo hiểm). Trong trường hợp có bất kỳ thắc mắc nào liên quan đến việc thanh toán lương, bạn được khuyến khích liên hệ với quản lý trực tiếp để được hỗ trợ. Thông tin về tiền lương là thông tin cá nhân và cần được bảo mật, không được chia sẻ với các nhân viên khác. Việc chuyển lương sẽ được thực hiện từ tài khoản của Công ty vào ngày 05 và ngày 20 hàng tháng. Thời gian nhận thực tế có thể khác nhau tùy thuộc vào ngân hàng mà bạn sử dụng. Trong trường hợp các ngày này rơi vào ngày nghỉ, Công ty sẽ thực hiện chuyển lương sớm hơn hoặc muộn hơn tùy theo tình hình thực tế; tuy nhiên, thời gian điều chỉnh sẽ không vượt quá hai (02) ngày làm việc.</p>
<p><strong>ii) Thanh toán vượt mức</strong></p>
<p>Nếu bạn nhận được khoản lương bất thường vì bất kỳ lý do gì, khoản thanh toán vượt mức sẽ được khấu trừ vào tháng sau hoặc sẽ xem xét chia dần cho những tháng tiếp theo.</p>
<p><strong>iii) Thuế</strong></p>
<p>Mỗi năm bạn sẽ nhận được một báo cáo tóm tắt cho biết tổng số lương bạn đã nhận được, số thuế đã nộp và những miễn trừ khác. Tài liệu này nên được giữ ở nơi an toàn trong trường hợp bạn cần dùng cho việc truy thu thuế.</p>
<p><strong>iv) Làm việc thêm giờ</strong></p>
<p>Đối với chính sách thời gian làm việc ngoài giờ, Unios Việt Nam đang áp dụng theo hình thức sau:</p>
<ul><li>Thời gian làm việc ngoài giờ do Công ty tổ chức và thăm</li></ul>
<p>hỏi ý kiến từ nhân viên. Sau khi nhận được chấp thuận từ hai phía, việc (OT) này sẽ được Công ty trả lương theo đúng như quy định của Nhà nước.</p>
<ul><li>Thời gian tăng ca không quá 40 giờ/tháng và 200 giờ/</li></ul>
<p>năm. Bạn cần làm đăng ký Request (OT) và được Approval từ cấp trên trước khi tăng ca. Lưu ý: Nếu đơn này không được ký nhận, bạn sẽ không được nhận phí tăng ca cho khoảng thời gian làm việc đó. Những khoảng thời gian làm thêm để hoàn thành những công việc thường ngày của bạn, trong trường hợp bạn không đủ khả năng hoàn thành những công việc này trong giờ làm việc, sẽ không được tính vào tăng ca. Tại Unios Vietnam, công ty không khuyến khích bạn làm thêm giờ ngoài ý muốn để đảm bảo tính cân bằng trong công việc và cuộc sống, đồng thời tránh việc mất năng suất và tinh thần làm việc do mệt mỏi.</p>
<p><strong>v) Đánh giá mức lương</strong></p>
<p>Vào dịp cuối mỗi năm tài chính (tháng 6), công ty sẽ làm bảng đánh giá lại mức lương bạn được nhận trong năm. Tuy nhiên, công ty không đưa ra bất kỳ cam kết nào về việc tăng hoặc  giảm lương mỗi năm.</p>
<h4>3.4 Chế độ bảo hiểm</h4>
<p>Công ty sẽ đóng cho bạn các loại bảo hiểm như Bảo hiểm xã hội, Bảo hiểm y tế và Bảo hiểm thất nghiệp theo quy định của Bộ luật Lao động Việt Nam. Mức đóng bảo hiểm sẽ được căn cứ vào mức lương cơ bản được quy định trong hợp đồng lao động và thoả thuận của bạn đối với công ty.</p>' WHERE id = '884a0a07-4b4d-4d1c-ae3f-ec37ecbffa61';
UPDATE code_of_conduct_sections SET content_en = '<h4>4.1 General Terms</h4>
<p>This system is applied only to employees who have signed the official contract . For employees during the probationary period, all leave days will be treated as unpaid leave and shall not exceed two (02) days throughout the probation period. Upon successful completion of probation and confirmation of official employment, the Company will reinstate these two (02) days into your annual leave entitlement. Non-compliance leave in accordance with the regulations listed below will be counted as a violation of the company’s code of conduct and receive the corresponding discipline. Non-listed leave in the regulations below will be processed according to the Vietnam Labour Code. The types of holidays currently being applied at Unios Vietnam include:</p>
<ul><li>Annual Leave</li><li>Business Leave</li><li>Personal Sick Leave</li><li>Maternity Leave</li><li>Unpaid Leave</li><li>Compassionate Leave</li><li>Wedding Leave</li><li>Public Holidays</li></ul>
<h4>4.2 Annual Leave</h4>
<p>After signing an official contract with the company, you are entitled to twelve (12) paid vacation days in accordance with applicable employment law (probation included). For every five year (05) years of service, you will be added one (01) day to the annual leave. The next increasement will be at 15 years and 30 years. The deadlines to apply leave application form:</p>
<ul><li>For annual leave under two (02) days: apply via</li></ul>
<p>software one (01) week in advance.</p>
<ul><li>For annual leave more than two (02) days: apply via</li></ul>
<p>software two (02) weeks in advance. You are encouraged to use up these days off throughout the year. This leave will not be cumulated to the subsequent</p>
<p>theo.</p>
<p>year. In the event that by the end of December you still have unused annual leave days, you will receive payment for the remaining annual leave days in the final salary payment of the year. The payment amount will be calculated as follows: Total basic salary for the year / Total number of working days in the year * Number of remaining AL days. Depending on the personnel situation and workload, the number of approved leave will be limited in the following time frames:</p>
<ul><li>Peak time from November to before Lunar New</li></ul>
<p>Year</p>
<ul><li>Company events</li></ul>
<h4>4.3 Business Leave</h4>
<p>Depending on the business, the company will ask you to go on business during the working period. Business schedule (including airfares and accommodation) will be arranged by the company and sent to you by email. In case the company asks you to arrange this schedule yourself, you need to fill out the Business Trip Itinerary  form and send it to Operation/HR one (01) week in advance. During the business trip, for every one (01) day off business, you will be counted one (01) working day.</p>
<h4>4.4 Personal Sick Leave</h4>
<p>If you are in unstable health, or are unable to work due to infectious diseases that will threaten the community, the company encourages you to rest at home until you have recovered. You are entitled to twelve (12) days/year of sick leave and no more than two (02) days/month as follows:</p>
<ul><li>Notify your line manager 3 hours in advance</li><li>Show your doctor’s certificate within 3 days of starting</li></ul>
<p>to work again</p>
<ul><li>In case you need the sick leave for more than two (02)</li></ul>
<p>days, you should express directly to your manager for the best solution. Please note:</p>
<ul><li>In the event that your doctor’s certificate is valid,</li></ul>
<p>the company will help you document and request payment from the insurance company. This leave will be unpaid.</p>
<ul><li>In the event that you are not able to present your</li></ul>
<p>doctor’s certificate, this leave will be deducted from your annual leave.</p>
<ul><li>In case you have used up your annual leave, this leave</li></ul>
<p>will be marked as unpaid.</p>
<ul><li>In case of force majeure, please contact your line</li></ul>
<p>manager as soon as possible and submit all relevant documents as a basis for approval.</p>
<h4>4.5 Maternity Leave</h4>
<p>Under the Labour Code and the company policy, you need to have worked at the company for at least one (01) year up to your due labour date to receive maternity leave. You are entitled to maternity leave for a total of 24 weeks from the date you start your prenatal leave to the date you return to work. In case you want an extra leave, you shall notify the company two (02) weeks before your return to work. You have the right to combine maternity leave with other types of leave. However, the total leave period time must not exceed 52 weeks. Women who are 7 months or more into their pregnancy or nursing children under 12 months old are entitled to a one (01) working hour reduction per day without diminution to their remuneration or employment benefits.</p>
<h4>4.6 Unpaid Leave</h4>
<p>Unpaid leave is only available when you have used up your annual leave. In case you want to apply for unpaid leave, please apply through Teams software to your line manager following the deadlines:</p>
<ul><li>For unpaid leave under two (02) days: apply via Teams</li></ul>
<p>software one (01) week in advance.</p>
<ul><li>For unpaid leave more than two (02) days: apply via</li></ul>
<p>Teams software two (02) weeks in advance. Total leave period must not exceed two (02) weeks except for the following cases:</p>
<ul><li>Medical leave with proof from doctor (must have</li></ul>
<p>sau:</p>
<p>signature and stamp from doctor)</p>
<ul><li>Take care of the spouse, children, adopted children,</li></ul>
<p>parents-in-law for medical examination and treatment (must be signed and sealed by the doctor).</p>
<ul><li>Maternity leave in accordance with the current labour</li></ul>
<p>law Other reason must be discussed with line manager for the best solutions.</p>
<h4>4.7 Compassionate Leave</h4>
<p>According to the current labour law and company rules, you are entitled to take leave to serve the deceased according to the following provisions: Vacation is entitled to three (03) days off paid when:</p>
<ul><li>Biological parents or foster parents die</li><li>Biological parents or foster parents of the spouse</li></ul>
<p>die</p>
<ul><li>Wife/husband or biological/adopted children dies</li></ul>
<p>Vacation is not entitled to one (01) day off unpaid when:</p>
<ul><li>Grandfather/grandmother dies</li><li>Brother/sister dies</li></ul>
<p>In the event of the above situation, please notify directly to the manager within 24 hours.</p>
<h4>4.8 Wedding Leave</h4>
<p>According to the Labour code and the current company policy, you are entitled to take leave to organize the wedding according to the following provisions: Vacation is entitled to three (03) day-off paid when:</p>
<ul><li>Yourself get married</li><li>Your biological/adopted children get married</li></ul>
<p>Vacation is not entitled to one (01) day-off unpaid when:</p>
<ul><li>Biological father/mother or foster father/mother get</li></ul>
<p>married</p>
<ul><li>Biological father/mother or foster father/mother of the</li></ul>
<p>spouse get married</p>
<ul><li>Brother/sister get married</li></ul>
<h4>4.9 Public Holidays</h4>
<p>According to the Labour code and the current company policy, you are entitled to take public holidays as follows:</p>
<ul><li>New Year’s Day: 01 day (January 1, Gregorian</li></ul>
<p>calendar)</p>
<ul><li>Lunar New Year (Tet Holiday): 05 days</li><li>Hung Kings’ Commemoration Day: 01 day (the 10th day</li></ul>
<p>of the 3rd lunar month)</p>
<ul><li>Reunification Day: 01 day (April 30, Gregorian</li></ul>
<p>calendar)</p>
<ul><li>International Labour Day: 01 day (May 1, Gregorian</li></ul>
<p>calendar)</p>
<ul><li>National Day: 02 days (September 2, Gregorian</li></ul>
<p>calendar)</p>
<ul><li>Christmas Day: 01 day (December 25, Gregorian</li></ul>
<p>calendar) The specific schedule will be notified to you in official writing. If any of the above public holidays fall on a weekly rest day, the Employee shall be entitled to a compensatory day off on the next working day. In case you are required to go to work on this holiday (except for the Christmas day), the company will pay you at least 400% in total.</p>', content_vi = '<h4>4.1 Điều khoản chung</h4>
<p>Đối tượng áp dụng: nhân viên đã ký hợp đồng chính thức hiện đang công tác tại Unios Vietnam. Đối với nhân viên trong thời gian thử việc, tất cả các ngày nghỉ đều được tính là nghỉ không hưởng lương và không được vượt quá hai (02) ngày trong toàn bộ giai đoạn thử việc. Sau khi hoàn thành thời gian thử việc và ký kết hợp đồng lao động chính thức, Công ty sẽ hoàn trả lại hai (02) ngày nghỉ này vào số ngày phép năm của bạn. Việc nghỉ phép không tuân thủ theo đúng quy định được liệt kê dưới đây sẽ được tính là vi phạm vào quy tắc ứng xử của công ty và nhận kỷ luật tương ứng. Việc nghỉ phép không được liệt kê trong các trường hợp dưới đây sẽ được giải quyết theo Bộ luật Lao động hiện hành. Các loại ngày nghỉ trong năm hiện đang được áp dụng tại Unios Vietnam bao gồm:</p>
<ul><li>Nghỉ phép năm</li><li>Nghỉ công tác</li><li>Nghỉ ốm cá nhân</li><li>Nghỉ thai sản</li><li>Nghỉ không lương</li><li>Nghỉ ma chay</li><li>Nghỉ kết hôn</li><li>Các ngày nghỉ lễ</li></ul>
<h4>4.2 Nghỉ phép năm</h4>
<p>Sau khi ký hợp đồng chính thức với công ty, bạn được hưởng 12 ngày phép có lương theo luật lao động hiện hành và tương ứng với số tháng làm việc của bạn tại Unios Vietnam (bao gồm cả các tháng thử việc). Với mỗi năm (05) năm thâm niên, bạn sẽ được cộng một (01) ngày vào nghỉ phép năm. Lần tăng tiếp theo ở mốc 15 năm và 30 năm. Thời hạn nộp đơn nghỉ phép như sau:</p>
<ul><li>Trường hợp nghỉ dưới hai (02) ngày: nộp đơn qua phần</li></ul>
<p>mềm trước một (01) tuần.</p>
<ul><li>Trường hợp nghỉ trên hai (02) ngày: nộp đơn qua phần</li></ul>
<p>mềm trước hai (02) tuần. Bạn được khuyến khích sử dụng hết ngày phép này trong năm</p>
<p>và ngày phép này sẽ không được cộng dồn cho các năm tiếp</p>
<p>Trong trường hợp đến hết tháng 12 mà bạn vẫn còn ngày phép chưa sử dụng, bạn sẽ được nhận thanh toán chi phí ngày phép dư trong đợt thanh toán lương cuối cùng của năm. Mức thanh toán được tính như sau: Tổng lương căn bản trong năm / Tổng số ngày công trong năm * Số ngày nghỉ phép còn lại Tuỳ thuộc vào tình hình nhân sự và khối lượng công việc, số lượng đơn nghỉ phép được duyệt sẽ bị hạn chế trong các khung thời gian sau:</p>
<ul><li>Thời gian cao điểm từ tháng 11 đến trước Tết Âm</li></ul>
<p>Lịch</p>
<ul><li>Các đợt tổ chức sự kiện của công ty</li></ul>
<h4>4.3 Đi công tác</h4>
<p>Tuỳ thuộc vào tình hình kinh doanh mà công ty sẽ yêu cầu bạn đi công tác trong khoảng thời gian làm việc. Lịch trình công tác (bao gồm vé máy bay và chỗ ăn ở) sẽ được công ty sắp xếp và gửi đến bạn qua email. Trong trường hợp công ty yêu cầu bạn tự sắp xếp lịch trình này, bạn cần điền vào form Business Trip Itinerary  và gửi đến phòng Operation/HR trước một (01) tuần. Trong thời gian đi công tác, với mỗi một (01) ngày nghỉ công tác, bạn sẽ được tính một (01) ngày làm việc.</p>
<h4>4.4 Nghỉ ốm cá nhân</h4>
<p>Nếu bạn đang trong tình trạng sức khoẻ không ổn định, hoặc không thể đi làm do mắc các bệnh truyền nhiễm gây nguy hiểm đến cộng đồng, công ty khuyến khích bạn nghỉ ngơi tại nhà cho đến khi sức khoẻ trở lại bình thường. Bạn được quyền nghỉ ốm 12 ngày/năm và không quá hai (02) ngày/tháng theo quy định sau:</p>
<ul><li>Báo với người quản lý 3 tiếng trước giờ làm việc</li><li>Trình giấy khám bác sĩ trong vòng 3 ngày sau khi bạn</li></ul>
<p>bắt đầu đi làm trở lại.</p>
<ul><li>Trong trường hợp bạn cần nghỉ ốm quá hai (02) ngày,</li></ul>
<p>hãy trình bày với người quản lý trực tiếp để đưa ra phương án tốt nhất. Lưu ý:</p>
<ul><li>Trong trường hợp giấy khám bác sĩ của bạn hợp lệ, công</li></ul>
<p>ty sẽ giúp bạn lập hồ sơ và yêu cầu thanh toán từ phía công ty bảo hiểm. Ngày nghỉ này sẽ được tính là không lương.</p>
<ul><li>Trong trường hợp bạn không thể trình giấy bác sĩ, ngày</li></ul>
<p>nghỉ ốm này sẽ được trừ vào ngày nghỉ phép năm của bạn.</p>
<ul><li>Trong trường hợp bạn không còn ngày nghỉ phép năm,</li></ul>
<p>ngày nghỉ này sẽ được tính là nghỉ không lương.</p>
<ul><li>Trong các trường hợp bất khả kháng, bạn hãy liên hệ</li></ul>
<p>với quản lý trực tiếp để xác nhận nghỉ và nộp các giấy tờ liên quan để làm căn cứ xét duyệt.</p>
<h4>4.5 Nghỉ thai sản</h4>
<p>Theo luật lao động hiện hành và nội quy của công ty, bạn cần làm việc ở công ty ít nhất là một (01) năm tính đến ngày bạn dự sinh để được hưởng chế độ nghỉ thai sản này. Bạn được hưởng chế độ nghỉ thai sản với tổng thời gian là 24 tuần tính từ ngày bạn bắt đầu nghỉ trước khi sinh cho đến ngày bạn đi làm trở lại. Trong trường hợp muốn nghỉ thêm, bạn cần thông báo với công ty hai (02) tuần trước ngày bạn đi làm trở lại. Bạn có quyền gộp chung ngày nghỉ thai sản với các loại ngày phép khác, tuy nhiên thời gian nghỉ thêm không được quá 52 tuần. Thai phụ từ tháng thứ 7 trở đi hoặc đang nuôi con dưới 12 tháng tuổi được giảm bớt một (01) giờ làm việc mỗi ngày mà không bị cắt giảm tiền lương và quyền lợi.</p>
<h4>4.6 Nghỉ không lương</h4>
<p>Nghỉ không lương chỉ được áp dụng khi bạn đã sử dụng thời gian hết thời gian nghỉ phép năm của mình. Trong trường hợp bạn muốn xin nghỉ phép không lương, vui lòng nộp đơn qua phần mềm Teams cho người quản lý trực tiếp theo thời hạn sau:</p>
<ul><li>Trường hợp nghỉ dưới hai (02) ngày: nộp đơn qua phần</li></ul>
<p>mềm Teams trước một (01) tuần.</p>
<ul><li>Trường hợp nghỉ trên hai (02) ngày: nộp đơn qua phần</li></ul>
<p>mềm Teams trước hai (02) tuần. Thời gian nghỉ không được quá hai (02) tuần ngoại trừ các trường hợp sau:</p>
<ul><li>Nghỉ khám chữa bệnh có chứng minh từ bác sĩ (phải có</li></ul>
<p>chữ ký và đóng dấu từ bác sĩ)</p>
<ul><li>Nghỉ chăm sóc vợ/chồng, con ruột/con nuôi, cha mẹ</li></ul>
<p>chồng/cha mẹ vợ (“người thân”) khám chữa bệnh (phải có chữ ký và đóng dấu từ bác sĩ).</p>
<ul><li>Nghỉ thai sản theo quy định của luật lao động hiện</li></ul>
<p>hành. Các trường hợp khác cần được sự phê duyệt từ người quản lý trực tiếp.</p>
<h4>4.7 Nghỉ ma chay</h4>
<p>Theo luật lao động hiện hành và nội quy của công ty, bạn được quyền xin nghỉ phép để phụng sự người quá cố theo quy định sau: Nghỉ phép được hưởng lương ba (03) ngày khi:</p>
<ul><li>Cha đẻ/mẹ đẻ hoặc cha nuôi/mẹ nuôi qua đời</li><li>Cha đẻ/mẹ đẻ hoặc cha nuôi/mẹ nuôi của vợ hoặc</li></ul>
<p>chồng qua đời</p>
<ul><li>Vợ/chồng hoặc con đẻ/con nuôi qua đời</li></ul>
<p>Nghỉ phép không được hưởng lương một (01) ngày khi:</p>
<ul><li>Ông nội/bà nội hoặc ông ngoại/bà ngoại qua đời</li><li>Anh/chị hoặc em ruột qua đời</li></ul>
<p>Trong trường hợp xảy ra tình huống trên, vui lòng thông báo với người quản lý trực tiếp trong vòng 24 tiếng.</p>
<h4>4.8 Nghỉ kết hôn</h4>
<p>Theo luật lao động hiện hành và nội quy của công ty, bạn được quyền xin nghỉ phép để tổ chức hôn lễ theo quy định</p>
<p>Nghỉ phép được hưởng lương ba (03) ngày khi:</p>
<ul><li>Bản thân kết hôn</li><li>Con ruột/con nuôi kết hôn</li></ul>
<p>Nghỉ phép không được hưởng lương một (01) ngày khi:</p>
<ul><li>Cha đẻ/mẹ đẻ hoặc cha nuôi/mẹ nuôi kết hôn</li><li>Cha đẻ/mẹ đẻ hoặc cha nuôi/mẹ nuôi của vợ hoặc</li></ul>
<p>chồng kết hôn</p>
<ul><li>Anh/chị hoặc em ruột kết hôn</li></ul>
<h4>4.9 Các ngày nghỉ lễ</h4>
<p>Theo luật lao động hiện hành và nội quy của công ty, bạn được quyền nghỉ vào các ngày lễ như sau:</p>
<ul><li>Tết dương lịch: 01 ngày (ngày 01/01 dương lịch).</li><li>Tết âm lịch: 05 ngày.</li><li>Ngày Giỗ tổ Hùng Vương: 01 ngày (ngày 10 tháng 03</li></ul>
<p>âm lịch).</p>
<ul><li>Ngày Thống nhất đất nước: 01 ngày (ngày 30 tháng 04</li></ul>
<p>dương lịch)</p>
<ul><li>Ngày Quốc tế lao động: 01 ngày (ngày 01 tháng 05</li></ul>
<p>dương lịch)</p>
<ul><li>Quốc khánh: 02 ngày (ngày 02 tháng 9 dương lịch)</li><li>Ngày giáng sinh: 01 ngày (ngày 25 tháng 12 dương</li></ul>
<p>lịch) Lịch nghỉ cụ thể sẽ được thông báo đến bạn bằng văn bản chính thức. Nếu những ngày nghỉ nêu trên trùng vào ngày nghỉ hàng tuần, Người lao động sẽ được nghỉ bù vào ngày làm việc tiếp theo. Trong trường hợp công ty yêu cầu bạn đi làm vào ngày lễ này (trừ ngày Giáng Sinh), công ty sẽ trả lương cho bạn ít nhất bằng tổng cộng 400%.</p>' WHERE id = '8903026f-dc5b-46bc-a5db-17a711ce0c87';
UPDATE code_of_conduct_sections SET content_en = '<p>quan</p>
<h4>5.1 Right of search</h4>
<p>The company has the right to request your cooperation in conducting a search of you and your personal belongings (including your vehicle) if there is evidence or a witness indicating that you are in unauthorized possession of company property. Such a search will be carried out in the presence of one of your colleagues to ensure objectivity. You are required to open your bag, vehicle compartment, or clothing items during the inspection. You have the right to refuse to cooperate under human rights laws. However, in such cases, the company reserves the right to take disciplinary action in accordance with company regulations (for non-compliance with management directives) or to contact the police, depending on the severity of the situation.</p>
<h4>5.2 IT and computer policy</h4>
<p><strong>i) Virus protection</strong></p>
<p>In order to prevent the introduction of virus contamination into the software system, the following rules must be observed:</p>
<ul><li>Unauthorised software including public domain</li></ul>
<p>software, magazine cover disks/CDs, applications, or internet downloads must not be used; and</p>
<ul><li>All software must be virus checked using standard</li></ul>
<p>testing procedures before being used.</p>
<p><strong>ii) Use of computer equipment</strong></p>
<p>In order to control the use of the Employer’s computer equipment and reduce the risk of contamination, the following rules will apply:</p>
<ul><li>New software and applications must be checked and</li></ul>
<p>authorised by management before permitted</p>
<ul><li>Only authorised employees are permitted access to the</li></ul>
<p>Employer’s computer equipment</p>
<ul><li>Only software used for business applications may be</li></ul>
<p>used on the Employer’s computer equipment</p>
<ul><li>No software may be brought onto or taken from the</li></ul>
<p>Employer’s premises without prior authorisation</p>
<ul><li>Unauthorised copying and/or removal of computer</li></ul>
<p>equipment and/or software will result in disciplinary action up to and including termination.</p>
<ul><li>Company computers must not be used for personal</li></ul>
<p>purposes (including but not limited to freelance work, part-time jobs, etc.).</p>
<p><strong>iii) Internet policy</strong></p>
<p>Authorised employees are encouraged to make use of the internet as part of their professional activities. This includes, but is not limited to, accessing the internet on Employer’s devices. Attention must be paid to ensuring that no published information relevant to normal professional activities are allowed before material is released in the Employer’s name. This also inclused personal views. The availability and variety of information on the internet means that it can be used to obtain material reasonably considered to be offensive. The use of the internet to access and/or distribute any kind of offensive material, or material that is not work-related shall lead to disciplinary action including termination. The Employer will not tolerate the use of the internet at work for unofficial or inappropriate purposes, including:</p>
<ul><li>Accessing websites which put the Employer at risk</li></ul>
<p>of viruses, compromising copyright or intellectual property rights</p>
<ul><li>Using the Employer devices to access the internet for</li></ul>
<p>inappropriate or illegal purposes</p>
<ul><li>Using social media in breach of the Employer’s social</li></ul>
<p>media policy</p>
<ul><li>Connecting, posting or downloading any information</li></ul>
<p>unrelated to their employment and, in particular, pornographic or other offensive material and</p>
<ul><li>Engaging in computer hacking and other related</li></ul>
<p>activities, or attempting to disable or compromise the security of information contained on the Employer’s computers. You are reminded that these activities may constitute a criminal offence.</p>
<p><strong>iv) Email</strong></p>
<p>The use of the work email system (work email) is encouraged as its appropriate use facilitates efficiency. Used correctly, it is a facility that is of assistance to the Employer. However, inappropriate use causes a number of problems, including distractions, time wasting and legal claims. Unauthorised or inappropriate use of work email may result in disciplinary action.</p>
<p>Work email is available for communication and matters directly concerned with the legitimate business of the Employer. Employees using work email should:</p>
<ul><li>Comply with the Employer communication</li></ul>
<p>standards</p>
<ul><li>Only send emails to the relevant personel</li><li>Not use email as a substitute for face-to-face</li></ul>
<p>communication or telephone contact</p>
<ul><li>Not send inflammatory emails (i.e. emails that are</li></ul>
<p>abusive or may be perceived as abusive)</p>
<ul><li>Be aware that hasty messages sent without</li></ul>
<p>proper consideration can cause upset, concern or misunderstanding</p>
<ul><li>If the email is confidential, ensure that the necessary</li></ul>
<p>steps are taken to protect confidentiality</p>
<ul><li>Be aware that offers or contracts transmitted by email</li></ul>
<p>are as legally binding on the Employer as those sent on paper. The Employer will not tolerate the use of work email for unofficial or inappropriate purposes, including:</p>
<ul><li>Any messages that could constitute bullying,</li></ul>
<p>harassment or other detriment</p>
<ul><li>Personal use (eg social invitations, personal messages,</li></ul>
<p>jokes, cartoons, chain letters or other private matters)</p>
<ul><li>On-line gambling</li><li>Accessing or transmitting pornography</li><li>Registering personal social media</li><li>Transmitting copyright information</li><li>Posting confidential information about other</li></ul>
<p>employees, the Employer or its customers or suppliers.</p>
<p><strong>v) Monitoring</strong></p>
<p>The Employer considers any and all data created, stored or transmitted upon the systems (the Systems) as work product and as such, expressly reserves the right to monitor and review any data upon the Systems, including your usage and history, on an intermittent basis without notice. In addition to this, the Employer has the right to protect its business interests and confidentiality. This includes the right to survey, audit and/or monitor the Systems, including but not limited to:</p>
<ul><li>Monitoring sites users visit on the internet</li><li>Monitoring time spent on the internet</li><li>Reviewing material downloaded or uploaded</li><li>Reviewing emails sent and received.</li></ul>
<p>Information reports will be available to the Employer which can subsequently be used for matters such as system performance and availability, capacity planning, cost re- distribution and the identification of areas for personal development. For the avoidance of doubt, the Employer reserve the right to monitor all internet and email activity by you for the purposes of ensuring compliance with the Employer’s policies and procedures and the relevant regulatory requirements and you hereby consent to such monitoring. Information acquired through such monitoring may be used as evidence in disciplinary proceedings.</p>
<h4>5.3 Social Media</h4>
<p>Social media is a mechanism for communication and sharing, rather than one specific program, activity or object. It is often a website or other electronic application that enable users to create and share content or to participate in social networking. Whilst social media can be used to strengthen the Employer’s brand and overall image of the business, work related issues or materials being placed on social media can adversely affect the Employer, a customer/client, colleague or others. To protect the mutual interest of all involved, work related matters must not be placed on social media at any time either during or outside of working hours and this includes access via any mobile computer equipment, including mobile phone or other devices unless approved in advance. Work-related usually means that the Employer, its clients, suppliers, employees, contractors or any other associated parties can be identified and be in some way connected back to your relationship with the Employer. Where you have been authorised in relation to work related matters, you must not bring the Employer, its clients, suppliers, contractors or any other associated parties into disrepute through the content of your usage. While representing the Employer on social media, it is expected that you will exhibit a professional and courteous attitude with clients, your colleagues, suppliers and other members of the public and ensure that you act in the</p>
<p>Employer’s best interests at all times. All employees are prohibited from using personal social media (whether on the Employer’s devices or their own personal device) during work time for personal reasons. Any breach of this policy will be considered serious and may result in disciplinary action.</p>
<p><strong>vi) Phones and other services</strong></p>
<p>The Employer’s phones, computers, laptops and other devices are to be used for business purposes and where approved, reasonable incidental personal use. Personal calls to international numbers or other high cost numbers are not permitted. Any unauthorised personal use may be repayable by you and may result in disciplinary action up to and including termination. The Employer reserves the right to request to deduct the appropriate sums from your salary in the event that repayments are not made. Limited and reasonable use of personal mobile phones and other personal devices is permitted, provided such devices does not impact on your output or quality of work or workplace safety. The Employer reserves the right to direct you to switch off any device at any time.</p>
<p><strong>vii) Surveillance</strong></p>
<p>Surveillance may be conducted in the workplace using: Internet usage recording devices, such as data capture, web browsing and email history captured on servers, and keystroke recognition Any form of visual recording devices including all types of camera, such as CCTV cameras Any form of audio recording devices and Electronic recording devices in any part of the workplace. The surveillance may be conducted at any time and any employee may be subject to surveillance. The surveillance may be continuous or intermittent at the Employer’s discretion. The Employer may, at their discretion, disclose the surveillance records for any reason that is not barred by privacy legislation. You may consult with the Employer regarding any concerns about the surveillance. All cameras are visible and recording devices (including cameras) will not be placed in bathrooms or change rooms.</p>', content_vi = '<h4>5.1 Quyền lục soát</h4>
<p>Công ty có quyền yêu cầu hợp tác lục soát bạn và tài sản cá nhân (bao gồm phương tiện di chuyển) nếu công ty có bằng chứng hoặc nhân chứng về việc bạn chiếm hữu bất chính tài sản của công ty. Việc lục soát này sẽ được thực hiện cùng với 1 đồng nghiệp của bạn để đảm bảo tính khách quan. Bạn được yêu cầu mở túi xách/cốp xe/túi quần áo trong quá trình kiểm tra. Bạn có quyền từ chối hợp tác theo luật nhân quyền. Tuy nhiên trong trường hợp này, công ty có quyền xử lý kỷ luật theo quy định của công ty (không tuân theo sự điều phối từ ban quản lý) hoặc gọi cảnh sát, tuỳ vào mức độ nghiêm trọng của nó.</p>
<h4>5.2 Quản lý thông tin mạng và máy tính</h4>
<p><strong>i) Chống virus</strong></p>
<p>Nhằm ngăn chặn sự xâm nhập của virus vào hệ thống máy tính của công ty, bạn phải tuân thủ những quy tắc sau:</p>
<ul><li>Không cài ứng dụng, phần mềm trái phép, phần mềm</li></ul>
<p>trong đĩa CD, đĩa mềm, download trên những trang web có nguồn gốc không rõ ràng; và</p>
<ul><li>Tất cả những phần mềm được cài đặt đều phải thông</li></ul>
<p>qua bộ phận IT và được quét virus theo quy định của công ty</p>
<p><strong>ii) Sử dụng các thiết bị máy tính</strong></p>
<p>Để kiểm soát việc sử dụng các thiết bị máy tính của công ty và tránh lây nhiễm virus gây thiệt hại đến tài sản chung, cần tuân thủ những quy tắc sau:</p>
<ul><li>Việc giới thiệu những phần mềm mới phải được sự cho</li></ul>
<p>phép của phòng ban liên quan</p>
<ul><li>Chỉ những nhân viên được uỷ quyền mới được sử dụng</li></ul>
<p>máy tính của công ty</p>
<ul><li>Chỉ được sử dụng những phần mềm phục vụ cho công</li></ul>
<p>việc cho máy tính được công ty cấp</p>
<ul><li>Không được mang hoặc các phần mềm do công ty cấp</li></ul>
<p>ra ngoài mà chưa được sự đồng ý của phòng ban liên</p>
<ul><li>Sao chép hoặc gỡ bỏ trái phép phần mềm thiết bị máy</li></ul>
<p>tính có thể dẫn đến các biện pháp kỷ luật.</p>
<ul><li>Không được sử dụng máy tính công ty cho các mục đích</li></ul>
<p>cá nhân (bao gồm nhưng không giới hạn: các công việc tự do, bán thời gian, v.v.)</p>
<p><strong>iii) Quản lý thông tin mạng</strong></p>
<p>Tất cả các nhân viên được khuyến khích sử dụng internet để phục vụ cho các tác vụ thường ngày. Thiết bị sử dụng bao gồm nhưng không giới hạn ở máy tính cũng như các thiết bị di động, máy tính bảng, điện thoại cá nhân. Tuy nhiên, bạn cần chú ý không được đăng các thông tin chưa chính thức hoặc đưa những quan điểm cá nhân lên internet và mạng xã hội dưới danh nghĩa công ty. Sự đa dạng và tính khả dụng của internet về những thông tin tiêu cực có thể gây ảnh hưởng nguy hại đến danh tiếng doanh nghiệp. Việc sử dụng internet để tung những tài liệu mật, những thông tin công kích đến công ty sẽ dẫn đến kỷ luật bao gồm buộc thôi việc. Công ty sẽ không chấp nhận nhân viên sử dụng internet tại nơi làm việc cho những mục đích sau:</p>
<ul><li>Truy cập những trang web khiến thiết bị máy tính bị</li></ul>
<p>nhiễm virus, xâm phạm bản quyền hoặc sở hữu trí tuệ</p>
<ul><li>Sử dụng internet tại công ty cho những mục đích bất</li></ul>
<p>hợp pháp</p>
<ul><li>Sử dụng mạng xã hội trái với chính sách truyền thông</li></ul>
<p>của công ty</p>
<ul><li>Truy cập và đăng tải hoặc tải về những nội dung không</li></ul>
<p>liên quan đến công việc, đặc biệt là nội dung khiêu dâm hoặc những tài liệu công kích chính quyền</p>
<ul><li>Tham gia vào hoạt động hack phần mềm hoặc các hành</li></ul>
<p>vi liên quan, cố gắng vô hiệu hoá hoặc xâm phạm bất hợp pháp những phần mềm, tài liệu thuộc quyền sở hữu của công ty Lưu ý, những hành vi trên có thể dẫn đến kỷ luật thôi việc và cấu thành tội hình sự.</p>
<p><strong>iv) Sử dụng email</strong></p>
<p>Công ty khuyến khích bạn sử dụng tốt email trong công việc vì tính khả dụng, tiện ích và sự chuyên nghiệp nó mang lại. Tuy nhiên, nếu sử dụng email vào những mục đích không thích hợp sẽ gây phiền nhiễu, ảnh hưởng đến thời gian và vi phạm pháp lý. Việc sử dụng email trái phép sẽ dẫn dến kỷ luật bao gồm buộc thôi việc.</p>
<p>Email công ty luôn sẵn sàng để bạn liên lạc với đồng nghiệp, khách hàng và những mục đích khác liên quan đến hoạt động kinh doanh hợp pháp của doanh nghiệp. Nhân viên sử dụng email công ty nên:</p>
<ul><li>Tuân thủ những tiêu chuẩn giao tiếp của công ty</li><li>Chỉ gửi email cho những người có liên quan</li><li>Không sử dụng email thay thế cho những trường hợp</li></ul>
<p>cần liên lạc trực tiếp hoặc liên lạc qua điện thoại</p>
<ul><li>Không lạm dụng spam email hoặc gửi nhiều email với</li></ul>
<p>cùng một nội dung mang tính chất quấy rối</p>
<ul><li>Không gửi những email chưa được chau chuốt, chỉnh sửa</li></ul>
<p>kỹ lưỡng có thể dẫn đến hiểu lầm đến khách hàng và đồng nghiệp</p>
<ul><li>Sử dụng những biện pháp bảo vệ cho những email mang</li></ul>
<p>tính bảo mật</p>
<ul><li>Lưu ý rằng những ưu đãi, chiếu khấu hoặc hợp đồng</li></ul>
<p>được gửi qua email phải được sự xác nhận của quản lý Không được sử dụng email công ty cho những mục đích không phù hợp như:</p>
<ul><li>Những tin nhắn mang tính chất doạ nạt, quấy rối hoặc</li></ul>
<p>gây bất lợi</p>
<ul><li>Mục đích cá nhân (gửi thư mời, tin nhắn cá nhân, các trò</li></ul>
<p>đùa hoặc hình ảnh không phù hợp)</p>
<ul><li>Cờ bạc trực tuyến</li><li>Truy cập hoặc tuyên truyền những tài liệu có mục đích</li></ul>
<p>khiêu dâm</p>
<ul><li>Đăng ký mạng xã hội cá nhân</li><li>Tuyên truyền thông tin bản quyền bất hợp pháp</li><li>Tuyên truyền các thông tin bí mật doanh nghiệp, đồng</li></ul>
<p>nghiệp, các khách hàng, đối tác hoặc các tổ chức cá nhân khác</p>
<p><strong>v) Quyền giám sát</strong></p>
<p>Công ty có quyền giám sát, xem xét và truy cứu tất cả các dữ liệu được tạo, lưu trữ, tuyên truyền trên các kênh thông tin thuộc hệ thống doanh nghiệp, bao gồm việc sử dụng thiết bị máy tính và lịch sử truy cập của bạn trên cơ sở không liên tục và không cần thông báo trước. Ngoài ra, công ty có quyền bảo vệ lợi ích và bảo mật kinh doanh của mình, quyền hạn này bao gồm việc khảo sát, kiểm tra và giám sát hệ thống mạng, bao gồm nhưng không giới hạn như sau:</p>
<ul><li>Giám sát số lượng truy cập internet</li><li>Giám sát thời lượng truy cập internet</li><li>Giám sát nội dung đăng hoặc tải về</li><li>Xem xét các emails được gửi và nhận</li></ul>
<p>Những thông tin được báo cáo lên công ty sẽ được sử dụng cho các mục đích như tính toán hiệu suất và tính khả dụng của hệ thống, lập kế hoạch phân phối nhân lực, tính toán chi phí hao tổn và xác định các đường hướng phát triển cho cá nhân. Để tránh hiểu lầm, công ty có quyền giám sát các hoạt động internet và email của bạn nhằm mục đích đảm bảo tuân thủ các chính sách, quy trình tiêu chuẩn và các yêu cầu quy định liên quan của công ty đặt ra và bạn đồng ý với việc giám sát đó. Những thông tin từ việc giám sát này sẽ được sử dụng để làm bằng chứng trong việc xử lý kỷ luật hoặc tố tụng hình sự.</p>
<h4>5.3 Mạng xã hội</h4>
<p>Mạng xã hội là dịch vụ kết nối người dùng có cùng mục đích, sở thích thông qua website, ứng dụng điện tử. Những thành viên tham gia vào mạng xã hội có thể chia sẻ thông tin, kết bạn. Khi mức độ phát tán của mạng xã hội ngày càng rộng rãi, nó trở thành một con dao 2 lưỡi. Trong kinh doanh, mạng xã hội có thể được sử dụng như một công cụ để củng cố thương hiệu và hình ảnh của doanh nghiệp. Tuy nhiên, những vấn đề, tài liệu liên quan mang tính chất tiêu cực nếu được phát tán trên các phương tiện truyền thông có thể gây ảnh hưởng xấu đến hình ảnh công ty, uy tín đồng nghiệp và khách hàng. Để bảo vệ lợi ích chung của các bên liên quan, bạn được yêu cầu không được đăng lên mạng xã hội các vấn đề liên quan đến công việc cần được bảo mật vào bất kì lúc nào, kể cả trong và ngoài giờ làm việc, bao gồm truy cập thông qua các thiết bị điện tử di dộng, điện thoại và các thiết bị liên quan trừ khi được sự cho phép của ban quản lý. Vấn đề liên quan đến công việc bao gồm thông tin về nhà thầu, chủ đầu tư, khách hàng, nhà cung cấp, nhân viên hoặc bất kì bên liên quan nào có quan hệ tới công ty. Trong trường hợp được uỷ quyền truy cập đến các thông tin quan trọng về nhà thầu, chủ đầu tư, khách hàng, nhà cung cấp, bạn bị nghiêm cấm đưa những thông tin này lên mạng xã hội của bạn. Trong trường hợp bạn được đại diện cho công ty trên các phương tiện truyền thông xã hội, bạn được yêu cầu thể hiện thái độ chuyên nghiệp đến khách hàng, đồng nghiệp, các nhà</p>
<p>cung cấp và nhà thầu, cộng đồng mạng; và đảm bảo rằng những hoạt động của bạn trên trang mạng luôn đặt lợi ích và danh tiếng của công ty lên hàng đầu. Tất cả các nhân viên bị cấm sử dụng mạng xã hội cá nhân trong thời gian làm việc (bao gồm trên thiết bị máy tính của công ty hoặc cá nhân). Vi phạm chính sách mạng xã hội sẽ dẫn đến những hình thức kỷ luật thích hợp và tối đa là buộc thôi việc.</p>
<p><strong>vi) Điện thoại và các thiết bị khác</strong></p>
<p>Bạn được quyền sử dụng ngẫu nhiên các thiết bị máy tính, điện thoại, laptop mà công ty cung cấp trong một phạm vi hợp lý và được chấp thuận. Lưu ý không sử dụng điện thoại công ty cho những cuộc gọi cá nhân có chi phí cao hoặc mang phạm vi quốc tế. Bất kỳ những sử dụng cá nhân nào chưa được phép mang lại tổn phí cho công ty cũng sẽ bị yêu cầu hoàn trả và sẽ có những hình thức kỷ luật thích hợp. Công ty có quyền yêu cầu bạn khấu trừ tiền lương cho những thanh toán chưa được thực hiện. Sử dụng hạn chế và hợp lý điện thoại và các thiết bị cá nhân, miễn là nó không ảnh hưởng đến chất lượng đầu ra của công việc và an toàn công sở. Công ty có quyền yêu cầu bạn tắt điện thoại bất kỳ lúc nào nếu thấy thời lượng sử dụng của bạn không hợp lý.</p>
<p><strong>vii) Hệ thống giám sát</strong></p>
<p>Các hệ thống giám sát sẽ được đặt ở nơi làm việc và bao gồm:</p>
<ul><li>Thiết bị ghi lại lịch sử sử dụng internet, ví dụ như hệ</li></ul>
<p>thống chụp dữ liệu trình duyệt web, lịch sử email được ghi lại trên máy chủ.</p>
<ul><li>Các thiết bị ghi hình trực quan ví dụ như camera giám</li></ul>
<p>sát, CCTV, etc.</p>
<ul><li>Các thiết bị ghi âm</li><li>Các thiết bị điện tử khác trong phạm vi làm việc</li></ul>
<p>Hệ thống giám sát có thể hoạt động bất kỳ lúc nào, liên tục hoặc gián đoạn tuỳ thuộc vào quyết định của ban quản lý. Công ty có quyền tiết lộ hồ sơ giám sát với các bên liên quan miễn là nó không vi phạm đến quyền riêng tư. Bạn có thể tham khảo ý kiến của công ty về bất kỳ mối quan tâm nào đến việc giám sát này. Tất cả các camera và các thiết bị ghi âm sẽ không được đặt ở khu vực phòng tắm và phòng thay đồ. Mục đích của hệ thống giám sát này là đảm bảo an toàn và</p>' WHERE id = '6fa5a18e-8f07-41e8-adca-a81a34ce5305';
UPDATE code_of_conduct_sections SET content_en = '<p>Unios.</p>
<h4>6.1 Behaviour at work</h4>
<p>You should behave with civility towards fellow colleagues, clients and members of the public, whilst at work. Rudeness will not be permitted. Objectionable or insulting behaviour or bad language may result in disciplinary action up to and including termination. You should use your best endeavours to promote the interests of the Employer and shall, during normal working hours, devote the whole of your time, attention and abilities to the Employer and its affairs. Any involvement in activities which could be construed as being in competition with the Employer is not allowed.</p>
<h4>6.2 Customer service expectations</h4>
<p>You are required to adhere to essential standards of customer service. Specifically:</p>
<ul><li>Attend to customers and your jobs promptly</li><li>Smart casual dresscode or uniform with Unios logo</li><li>Introduce yourself by name</li><li>Acknowledge customers by name when possible</li><li>Greet and thank customers courteously</li><li>Listen and respond in an attentive way to customer</li></ul>
<p>inquiries</p>
<ul><li>Be polite, friendly and welcoming when communicating</li></ul>
<p>with customers, whether it be in person or by any other means</p>
<ul><li>Do not swear or speak crudely in front of customers</li><li>Respect and protect customer property and</li><li>Protect confidential information relating to</li></ul>
<p>customers.</p>
<ul><li>For women: neat hairstyle with make-up</li></ul>
<p>This list is not exhaustive.</p>
<h4>6.4 Friends and family in the workplace</h4>
<p>Friends and family must not be in the workplace, unless approved in advance by the Employer, due to an emergency or for genuine business reasons. It is your responsibility to ensure that friends and family are not in the workplace for longer than necessary.</p>
<h4>6.5 Wastage</h4>
<p>We maintain a policy of “minimum waste”, which is essential to the cost-effective and efficient running of the business. You are able to promote this policy by taking extra care during your normal duties by avoiding unnecessary or extravagant use of services, time, energy, etc. The following points are illustrations of this:</p>
<ul><li>Handle machines, equipment and stock with care</li><li>Turn off any unnecessary lighting and heating</li><li>Keep doors closed whenever possible</li><li>Double side printing, including re-using scrap paper,</li></ul>
<p>where possible</p>
<ul><li>Ask for other work if your job has come to a</li></ul>
<p>standstill</p>
<ul><li>Start with the minimum of delay after arriving for work</li></ul>
<p>and after breaks Further more:</p>
<ul><li>Any damage to vehicles, stock or property (including</li></ul>
<p>non-statutory safety equipment) that is the result of your carelessness, negligence or deliberate vandalism will render you liable to pay the full or part of the cost of repair or replacement</p>
<ul><li>Any loss to the Employer that is the result of your</li></ul>
<p>failure to observe rules, procedures or instruction, or is as a result of your negligent behaviour or your unsatisfactory standards of work, will render you liable to reimburse to us the full or part of the cost of the loss</p>
<ul><li>In the event of an at fault accident whilst driving one of</li></ul>
<p>the Employer’s vehicles you may be required to pay the cost of the insurance excess. In the event of failure to pay, the Employer reserves the right to request to deduct such costs from your pay.</p>
<h4>6.5 Dress and appearance</h4>
<p>Consistent with the culture of the Employer, you will be expected to present a professional image with regard to your appearance and standards of dress and maintain excellent standards of personal hygiene at all times. You should wear clothes appropriate to your job responsibilities, and they should be kept clean and tidy at all times. Personal protective equipment (PPE) and clothing may be</p>
<p>issued for your protection because of the nature of your job and if issued must be worn and used at all appropriate times. Failure to do so could be a contravention of your health and safety responsibilities. Specifically, you must ensure that you comply with the following requirements:</p>
<ul><li>For office based staff smart business attire with the</li></ul>
<p>company branded shirt is required. There will be casual Friday where employees are expected to look neat and presentable.</p>
<ul><li>Field based employees are to wear smart business</li></ul>
<p>attire at all times.</p>
<ul><li>Employees working in the warehouse are to wear steel</li></ul>
<p>capped boots, hi-vis shirt and pants at all times, with safety glasses and ear muffs when required.</p>
<ul><li>Unios badge and name tag are required at all time</li></ul>
<p>whenever you’re in the workplace or meeting with clients.</p>
<ul><li>If any branding material (for ex. Unios badge, name tag</li></ul>
<p>or logo shirt) is damaged, you must keep the damaged good and exchange it for a new one. If you arrive for work in a manner that does not comply with this policy, your manager will advise you that you are not dressed or groomed appropriately to perform your duties. As a result you may be sent home to change with any resulting lost time being unpaid. Any deliberate or persistent breaches of this policy may result in disciplinary action being taken against you. If you are in any doubt whether your attire is appropriate for your job role, you should contact management. In the event that the company refuses to sign the contract to continue or you unilaterally terminate the contract with Unios, you are required to return all Unios-branded assets.</p>', content_vi = '<h4>6.1 Ứng xử tại nơi làm việc</h4>
<p>Bạn được yêu cầu cư xử lịch sự với đồng nghiệp, khách hàng, những người ngoài xã hội trong khi làm việc. Nghiêm cấm cư xử thô lỗ, những hành vi phản cảm, xúc phạm đến nhân phẩm, sử dụng ngôn ngữ xấu. Việc vi phạm sẽ dẫn đến hình thức kỷ luật thích hợp bao gồm buộc thôi việc. Bạn nên sử dụng những nỗ lực tốt nhất của mình và dành hết khả năng để thúc đẩy lợi ích cho công ty trong giờ làm việc. Bất kỳ tham gia nào trong các hoạt động liên quan đến việc cạnh tranh với công ty đều không được phép.</p>
<h4>6.2 Chuẩn mực dịch vụ khách hàng</h4>
<p>Bạn được yêu cầu tuân thủ theo những chuẩn mực thiết yếu về dịch vụ khách hàng :</p>
<ul><li>Kết nối với khách hàng và công việc kịp thời</li><li>Mặc trang phục lịch sự hoặc đồng phục có logo</li></ul>
<ul><li>Giới thiệu bản thân bằng tên</li><li>Xưng hô với khách hàng bằng tên khi có thể</li><li>Chào hỏi, cảm ơn và xin lỗi khách hàng nếu cần một</li></ul>
<p>cách lịch sự</p>
<ul><li>Lắng nghe và trả lời tận tâm đối với những câu hỏi của</li></ul>
<p>khách hàng</p>
<ul><li>Lịch sự, niềm nở và thân thiện với khách hàng cho dù là</li></ul>
<p>giao tiếp qua điện thoại hay nói chuyện trực tiếp</p>
<ul><li>Không chửi thề, sử dụng ngôn từ thô lỗ trước mặt khách</li></ul>
<p>hàng</p>
<ul><li>Tôn trọng và bảo vệ tài sản của khách hàng</li><li>Bảo vệ thông tin bí mật của khách hàng</li><li>Đối với nữ: tóc tai gọn gàng, trang điểm nhẹ</li></ul>
<p>Danh sách này chưa đầy đủ và có thể bổ sung thêm.</p>
<h4>6.3 Bạn bè và gia đình tại nơi làm việc</h4>
<p>Không dẫn bạn bè và gia đình đến nơi làm việc, trừ những sự kiện của công ty yêu cầu sự tham gia của người thân, vì lý do khẩn cấp hoặc lý do kinh doanh. Bạn có trách nhiệm đảm bảo rằng người nhà và bạn bè của bạn không ở nơi làm việc lâu quá mức cần thiết.</p>
<h4>6.4 Chính sách chống lãng phí</h4>
<p>Công ty tuyên truyền chính sách chống lãng phí tối đa. Điều này cần thiết cho hoạt động kinh doanh hiệu quả và tiết kiệm chi phí vận hành công ty. Bạn có thể thúc đẩy chính sách này bằng những hành động thiết thực giúp hạn chế sự lãng phí không cần thiết khi sử dụng nguồn nhân lực, thời gian và năng lượng. Các ví dụ minh hoạ như:</p>
<ul><li>Xử lý trang thiết bị, máy móc và hàng hoá cẩn thận</li><li>Tắt các thiết bị điện, điều hoà không cần thiết</li><li>Đóng cửa khi đi ra ngoài</li><li>Sử dụng in 2 mặt, bao gồm tái chế giấy nháp khi cần</li></ul>
<p>thiết</p>
<ul><li>Yêu cầu thêm công việc khi đang nhàn rỗi</li><li>Hạn chế sự chậm trễ khi đi làm và sau giờ nghỉ trưa,</li></ul>
<p>nghỉ giữa. Ngoài ra:</p>
<ul><li>Bất kỳ thiệt hại đối với xe cộ hoặc tài sản chung của</li></ul>
<p>công ty là kết quả của sự bất cẩn, sơ xuất hoặc phá hoại có chủ ý sẽ bị yêu cầu hoàn trả lại một phần hoặc toàn bộ chi phí sửa chữa hoặc thay thế.</p>
<ul><li>Bất kỳ thiệt hại nào đối với công ty vì lý do bạn không</li></ul>
<p>tuân thủ theo những quy tắc, quy trình đã đặt ra từ trước, do hành vi bất cẩn hoặc do tiêu chuẩn công việc của bạn không đạt yêu cầu, công ty sẽ yêu cầu bạn hoàn trả lại toàn bộ hoặc một phần chi phí tổn thất.</p>
<ul><li>Trong trường hợp xảy ra tai nạn khi sử dụng xe của công</li></ul>
<p>ty, bạn được yêu cầu hoàn trả lại chi phí vượt mức bảo hiểm. Trong trường hợp bạn từ chối thanh toán, công ty có quyền khấu trừ trong khoản lương của bạn.</p>
<h4>6.5 Trang phục đi làm</h4>
<p>Để phù hợp với văn hoá của công ty, bạn được yêu cầu thể hiện một hình ảnh chuyên nghiệp liên quan đến ngoại hình, tiêu chuẩn ăn mặc và vệ sinh cá nhân. Bạn được yêu cầu mặc đồng phục hoặc trang phục phù hợp với vị trí công việc và giữ gìn sạch sẽ gọn gàng mọi lúc. Công ty sẽ cấp cho bạn trang phục bảo hộ lao động khi cần</p>
<p>thiết để bảo vệ bạn trong quá trình làm việc. Bạn được yêu cầu sử dụng những trang phục này khi đi đến công trường hoặc các khu vực yêu cầu mặc trang phục bảo hộ lao động. Làm trái quy định này sẽ ảnh hưởng trực tiếp đến an toàn lao động và sức khoẻ lâu dài của bạn. Cụ thể, bạn phải đảm bảo tuân thủ những yêu cầu sau:</p>
<ul><li>Đối với nhân viên văn phòng, yêu cầu mặc trang phục</li></ul>
<p>công sở lịch sự. Ngoại trừ ngày thứ 6 (casual day), bạn được quyền mặc trang phục tự do nhưng phải phù hợp với môi trường làm việc.</p>
<ul><li>Nhân viên giao hàng hoặc nhân viên sale cần mặc trang</li></ul>
<p>phục lịch sự hoặc áo có logo công ty.</p>
<ul><li>Nhân viên làm việc trong kho cần mang đồ bảo hộ, mắt</li></ul>
<p>kính hoặc găng tay khi cần thiết.</p>
<ul><li>Trong giờ làm việc hoặc khi đi gặp khách hàng, bạn được</li></ul>
<p>yêu cầu đeo thẻ tên và huy hiệu Unios. Huy hiệu Unios phải được đeo ở ngực áo trái hoặc phải.</p>
<ul><li>Trong trường hợp huy hiệu, thẻ tên hoặc áo có logo công</li></ul>
<p>ty bị hư hỏng, bạn cần nộp lại phôi cho công ty để được đổi mới. Nếu bạn đến công ty với trang phục không phù hợp, quản lý có quyền yêu cầu bạn về thay và thời gian đi làm trễ sẽ không được tính vào lương. Bất kỳ hành động vi phạm liên tục hoặc cố ý sẽ dẫn đến biện pháp kỷ luật thích hợp. Nếu có thắc mắc về trang phục, bạn có thể tham khảo ý kiến của người quản lý. Trong trường hợp công ty từ chối ký hợp đồng tiếp tục hoặc bạn đơn phương chấm dứt hợp đồng với Unios, bạn được yêu cầu nộp lại tất cả các tài sản mang thương hiệu Unios.</p>' WHERE id = '006022d5-4426-46cd-bff7-3382669a02c7';
UPDATE code_of_conduct_sections SET content_en = '<h4>7.2 Performance Review</h4>
<p>We recognise that during your employment with us you may find yourself less capable of conducting your duties. This might commonly be because either the job changes over a period of time and you fail to keep pace with the changes, or you change (perhaps because of health reasons) and you can no longer cope with the work. We retain discretion in respect of the capability procedures to take account of your length of service and to vary the procedures accordingly.</p>
<h4>7.1 Monthly Performance Report</h4>
<p>Each department has its own requirements regarding performance reporting and key performance indicators (KPIs). You are required to fully comply with all reporting requirements as instructed by your line manager. Failure to comply with these reporting requirements may be considered as not meeting the assigned performance targets.</p>
<h4>7.2 Performance Review</h4>
<p>In the final month of the financial year (June), you will participate in a performance review discussion with your line manager and the Human Resources department to assess your performance and capabilities over the past year. Based on your monthly performance evaluations, the Company will determine any decisions regarding salary adjustments and/or career advancement. If you wish to be considered for promotion, level progression, or a salary increase, you may refer to the Performance Profiles of higher-level positions to guide your development. The content of the annual performance review may vary from year to year and will be communicated to you at least one (01) month in advance for preparation. You are required to thoroughly prepare and submit your Self-Evaluation Form at least one (01) week prior to the scheduled review date. Failure to comply with the preparation and submission requirements may result in the performance review being declined and may impact the consideration of salary increases or promotions..</p>
<h4>7.3 Job changes/General Capability Issues</h4>
<p>If we have general concerns about your ability to perform your job or if the nature of your job changes, we will try to ensure that you understand the level of performance expected of you and that you receive adequate training and supervision. Concerns regarding your capability will normally first be discussed in an informal manner and you</p>
<p>will be given time to improve. If your standard of performance is still not adequate, you will be warned in writing that a failure to improve and to maintain the performance required could lead to your termination. We will also consider the possibility of a transfer to more suitable work if possible. If there is still no improvement after a reasonable time and we cannot transfer you to more suitable work, or if your level of performance has a serious or substantial effect on the Employer to its detriment, you will be dismissed with the appropriate notice.</p>
<h4>7.4 Personal Circumstances/Health Issues</h4>
<p>Personal circumstances may arise which do not prevent you from attending work but which prevent you from carrying out your normal duties (eg a lack of dexterity or general ill health). If such a situation arises, we will normally need to have details of your medical diagnosis and prognosis so that we have the benefit of expert advice. Under normal circumstances, this can be most easily obtained by asking your own doctor for a medical report. Your permission is needed before we can obtain such a report and we will expect you to co-operate in this matter should the need arise. When we have obtained as much information as possible regarding your condition and after consultation with you, a decision will be made about your future employment with the Employer in your current role or, where circumstances permit, in a more suitable role. There may also be personal circumstances which prevent you from attending work, either for a prolonged period or for frequent short absences. Under these circumstances, we will need to know when we can expect your attendance record to reach an acceptable level. This may again mean asking your own doctor for a medical report or by making whatever investigations are appropriate in the circumstances. When we have obtained as much information as possible regarding your condition, and after consultation with you, a decision will be made about your future employment with the Employer in your current role or, where circumstances permit, in a more suitable role.</p>', content_vi = '<p>Công ty hiểu rằng trong quá trình làm việc, bạn có thể thấy mình thiếu khả năng hoàn thành công việc của mình. Điều này có thể là do quy trình công việc thay đổi theo thời gian và bạn không kịp thích ứng, hoặc có thể do lý do sức khoẻ và bạn không đủ khả năng hoàn thành công việc. Công ty sẽ sử dụng các quy trình khảo sát năng lực và tính đến thâm niên làm việc của bạn trong công ty để có biện pháp giúp đỡ hoặc thay đổi công việc của bạn.</p>
<h4>7.1 Báo cáo đánh giá công việc hàng tháng</h4>
<p>Mỗi phòng ban có quy định riêng về việc báo cáo kết quả công việc và các chỉ số đánh giá hiệu quả lao động (KPIs). Bạn có trách nhiệm tuân thủ đầy đủ các yêu cầu báo cáo theo hướng dẫn của quản lý trực tiếp. Việc không thực hiện hoặc không tuân thủ các yêu cầu báo cáo này có thể được xem là không đạt chỉ tiêu công việc đã đề ra.</p>
<p>Vào tháng cuối cùng của năm tài chính (tháng Sáu), bạn sẽ tham gia buổi đánh giá hiệu suất làm việc cùng với quản lý trực tiếp và bộ phận Nhân sự, nhằm xem xét năng lực và kết quả công việc của bạn trong năm vừa qua. Dựa trên các đánh giá hiệu suất định kỳ hàng tháng, Công ty sẽ đưa ra quyết định liên quan đến việc điều chỉnh lương và/hoặc cơ hội thăng tiến của bạn. Trong trường hợp bạn có nguyện vọng được thăng chức, nâng bậc hoặc tăng lương, bạn có thể tham khảo các Performance Profiles  của các vị trí cao hơn để định hướng phát triển. Nội dung đánh giá hiệu suất hàng năm có thể thay đổi tùy theo từng năm và sẽ được thông báo đến bạn trước ít nhất một (01) tháng để chuẩn bị. Bạn có trách nhiệm chuẩn bị đầy đủ nội dung đánh giá và nộp báo cáo ( Self-Evaluation Form) ít nhất một (01) tuần trước ngày diễn ra buổi đánh giá. Việc không tuân thủ yêu cầu chuẩn bị và nộp báo cáo có thể dẫn đến việc buổi đánh giá bị từ chối thực hiện, đồng thời ảnh hưởng đến việc xem xét tăng lương hoặc thăng tiến.</p>
<h4>7.3 Thay đổi vị trí công việc và các vấn đề liên quan</h4>
<p>Nếu công ty có những lo ngại chung về khả năng hoàn thành công việc của bạn, hoặc nếu tính chất công việc của bạn thay đổi, công ty sẽ sẽ cố gắng đảm bảo rằng bạn hiểu được hiệu suất mong đợi của bạn sau khi bạn đã được đào tạo và giám sát. Mối quan tâm về khả năng của bạn sẽ được thảo</p>
<p>luận trước một cách không chính thức và bạn sẽ có một khoảng thời gian để cải thiện. Sau khoảng thời gian này, nếu hiệu suất làm việc của bạn vẫn chưa được thay đổi, bạn sẽ được thông báo bằng văn bản về việc nếu không cải thiện, công việc của bạn có thể bị chấm dứt. Công ty sẽ xem xét khả năng chuyển bạn sang công việc khác phù hợp hơn. Nếu vẫn không có sự cải thiện đáng kể sau một khoảng thời gian hợp lý, hoặc công ty không thể chuyển bạn sang một vị trí khác hoặc sự yếu kém trong khả năng làm việc của bạn ảnh hưởng lớn đến lợi ích của công ty, buộc lòng công ty phải đưa ra quyết định sa thải.</p>
<h4>7.4 Vấn đề sức khoẻ cá nhân</h4>
<p>Những vấn đề sức khoẻ cá nhân có thể không ngăn cản bạn đến công ty, nhưng sẽ ảnh hưởng đến bạn trong việc thực hiện những công việc bình thường nhất (chẳng hạn như thiếu khéo léo khi xử lý tình huống). Nếu trường hợp này phát sinh, công ty sẽ yêu cầu bạn cung cấp những giấy tờ chi tiết về việc chẩn đoán y tế từ những chuyên gia. Trong điều kiện thông thường, bạn có thể yêu cầu những giấy tờ này từ bác sĩ riêng hoặc các cơ sở y tế được cấp phép. Công ty sẽ cần sự cho phép của bạn khi cung cấp những giấy tờ này. Đồng thời, công ty mong đợi sự hợp tác từ bạn và sẵn lòng tư vấn và đưa ra những quyết định hợp lý trong việc thuyên chuyển công tác hoặc thay đổi bạn trong những vai trò phù hợp hơn. Trong trường hợp những vấn đề sức khoẻ này ảnh hưởng đến thời gian làm việc của bạn, khiến bạn vắng mặt thường xuyên trong một khoảng thời gian dài, công ty sẽ yêu cầu bạn cung cấp những giấy tờ chi tiết về chẩn đoán y tế và dự báo thời gian bạn có thể đi làm trở lại trong một điều kiện hợp lý. Đồng thời, công ty cũng cố gắng thu thập càng nhiều thông tin về tình trạng bệnh của bạn. Sau khi thảo luận và tham khảo thêm ý kiến của bạn, công ty sẽ có những quyết định phù hợp về việc làm của bạn trong tương lai.</p>' WHERE id = '5dca2c48-2883-4c98-8d5d-02df90731e0d';
UPDATE code_of_conduct_sections SET content_en = '<h4>8.1 Introduction</h4>
<p>The Company is committed to maintaining a professional, respectful, and high-performance working environment. This disciplinary policy is established to ensure consistency, fairness, and compliance with applicable labour laws in addressing employee misconduct. Any breach of the Code of Conduct, internal policies, or employment obligations may result in disciplinary action, depending on the severity and impact of the violation.</p>
<h4>8.2 Definition of Misconduct</h4>
<p>Misconduct includes, but is not limited to, any failure to comply with:</p>
<ul><li>The Code of Conduct</li><li>Internal policies and procedures</li><li>Employment contract obligations</li><li>Lawful instructions from management</li></ul>
<p>Examples of misconduct may include:</p>
<ul><li>Failure to meet reporting or performance</li></ul>
<p>requirements</p>
<ul><li>Violation of working hours or attendance rules</li><li>Disruptive, disrespectful, or inappropriate workplace</li></ul>
<p>behavior</p>
<ul><li>Misuse of Company property or resources</li><li>Breach of confidentiality or data protection</li><li>Acts that negatively impact the Company’s operations,</li></ul>
<p>reputation, or employees This list is not exhaustive.</p>
<h4>8.3 Serious misconduct (level 3)</h4>
<p>Disciplinary actions will be conducted in a fair, transparent, and consistent manner, in compliance with applicable labour laws. The general process includes:</p>
<ul><li>Identification and documentation of the violation</li><li>Notification to the employee</li></ul>
<ul><li>Opportunity for the employee to explain or provide</li></ul>
<p>clarification</p>
<ul><li>Review and assessment by management and/or HR</li><li>Decision on appropriate disciplinary action</li></ul>
<p>All disciplinary actions must be properly documented.</p>
<h4>8.4 Disciplinary procedure</h4>
<p>Depending on the severity and frequency of the violation, disciplinary actions may include:</p>
<ul><li>Verbal warning</li><li>Written warning</li><li>Extension of salary review period (not exceeding 6</li></ul>
<p>months)</p>
<ul><li>Demotion or removal from position</li><li>Termination of employment</li></ul>
<p>Serious misconduct may result in immediate termination without prior warning.</p>
<h4>8.5 Level 1 - Minor Misconduct</h4>
<p>Minor misconduct refers to low-impact behaviors that do not significantly affect the Company’s operations but still require correction. Examples include:</p>
<ul><li>Lateness or leaving early without proper notice</li><li>Failure to submit reports on time</li><li>Minor disruption or noise in the workplace</li><li>Failure to follow basic procedures or instructions</li><li>Improper workspace organization or carelessness with</li></ul>
<p>documents</p>
<h4>8.6 Level 2 - Moderate Misconduct</h4>
<p>Moderate misconduct includes repeated minor violations or behaviors that begin to affect work performance, discipline, or team dynamics. Examples include:</p>
<ul><li>Repeated failure to meet reporting or KPI requirements</li></ul>
<ul><li>Unauthorized absence (up to 1.5 days/month)</li><li>Failure to follow instructions from management</li><li>Use of working hours for personal matters without</li></ul>
<p>approval</p>
<ul><li>Inappropriate behavior affecting colleagues or work</li></ul>
<p>environment</p>
<ul><li>Misuse of Company resources for non-work purposes</li></ul>
<h4>8.7 Level 3 - Serious Misconduct</h4>
<p>Serious misconduct refers to actions that significantly impact the Company’s operations, reputation, financial position, or people. Examples include:</p>
<ul><li>Unauthorized absence (2–4.5 days/month)</li><li>Verbal abuse, harassment, or disrespectful behavior</li></ul>
<p>toward colleagues or clients</p>
<ul><li>Causing damage to Company property or financial loss</li><li>Breach of confidentiality or improper handling of sensi-</li></ul>
<p>tive information</p>
<ul><li>Abuse of authority or misuse of position for personal</li></ul>
<p>benefit</p>
<ul><li>Serious disruption to workplace order or Company</li></ul>
<p>culture</p>
<h4>8.8 Level 4 - Gross Misconduct</h4>
<p>Gross misconduct includes actions of a very serious nature that fundamentally breach trust and may result in immediate termination. Examples include:</p>
<ul><li>Theft, fraud, or embezzlement</li><li>Use, possession, or distribution of illegal drugs at the</li></ul>
<p>workplace</p>
<ul><li>Disclosure of trade secrets or critical confidential infor-</li></ul>
<p>mation</p>
<ul><li>Physical violence or intentional harm</li><li>Serious violation of Company policies resulting in major</li></ul>
<p>loss or risk</p>
<ul><li>Unauthorized absence of 5 days or more without valid</li></ul>
<p>reason</p>
<h4>8.9 Additional Rules</h4>
<ul><li>Repeated violations within the validity period of a warn-</li></ul>
<p>ing will escalate to the next level</p>
<ul><li>Severity and business impact may override standard</li></ul>
<p>Level 1 Verbal warning</p>
<p>Written warning</p>
<p>Final written warning</p>
<p>Level 2 Written warning</p>
<p>Final written warning</p>
<p>Demotion/Position removal</p>
<p>Level 3 Demotion/Position removal</p>
<p>Termination</p>
<p>Level 4 Termination</p>
<p>progression</p>
<ul><li>Disciplinary actions must follow due process and be</li></ul>
<p>documented</p>
<ul><li>The Company reserves the right to determine final disci-</li></ul>
<p>plinary outcomes</p>
<h4>8.10 Disciplinary Matrix</h4>', content_vi = '<h4>8.1 Lời nói đầu</h4>
<p>Công ty cam kết duy trì một môi trường làm việc chuyên nghiệp, tôn trọng và hiệu quả cao. Chính sách kỷ luật này được thiết lập nhằm đảm bảo tính nhất quán, công bằng và tuân thủ pháp luật lao động trong việc xử lý các hành vi vi phạm. Mọi hành vi vi phạm Bộ Quy tắc Ứng xử, nội quy nội bộ hoặc nghĩa vụ lao động đều có thể bị xử lý kỷ luật tùy theo mức độ và hậu quả của hành vi vi phạm.</p>
<h4>8.2 Giải thích các hành vi vi phạm</h4>
<p>Hành vi vi phạm kỷ luật bao gồm nhưng không giới hạn ở việc không tuân thủ:</p>
<ul><li>Bộ Quy tắc Ứng xử</li><li>Các chính sách và quy trình nội bộ</li><li>Nghĩa vụ theo Hợp đồng lao động</li><li>Các chỉ đạo hợp pháp từ cấp quản lý</li></ul>
<p>Các hành vi vi phạm có thể bao gồm:</p>
<ul><li>Không thực hiện đầy đủ các yêu cầu báo cáo hoặc chỉ</li></ul>
<p>tiêu công việc</p>
<ul><li>Vi phạm giờ làm việc hoặc quy định về chuyên cần</li><li>Hành vi gây mất trật tự, thiếu tôn trọng hoặc không</li></ul>
<p>phù hợp tại nơi làm việc</p>
<ul><li>Sử dụng tài sản hoặc nguồn lực của Công ty không đúng</li></ul>
<p>mục đích</p>
<ul><li>Vi phạm quy định về bảo mật thông tin</li><li>Các hành vi gây ảnh hưởng tiêu cực đến hoạt động, uy</li></ul>
<p>tín hoặc con người của Công ty Danh sách này mang tính chất tham khảo và chưa đầy đủ.</p>
<h4>8.3 Quy trình kỷ luật</h4>
<p>Việc xử lý kỷ luật sẽ được thực hiện một cách công bằng, minh bạch và nhất quán, tuân thủ quy định pháp luật lao động hiện hành. Quy trình xử lý kỷ luật bao gồm:</p>
<ul><li>Ghi nhận và xác minh hành vi vi phạm</li><li>Thông báo đến người lao động</li></ul>
<ul><li>Tạo cơ hội để người lao động giải trình</li><li>Xem xét, đánh giá bởi quản lý và/hoặc bộ phận Nhân</li></ul>
<p>sự</p>
<ul><li>Quyết định hình thức xử lý phù hợp</li><li>Tất cả các quyết định kỷ luật phải được lập thành văn</li></ul>
<p>bản và lưu trữ theo quy định</p>
<h4>8.4 Các hình thức kỷ luật</h4>
<p>Tùy theo mức độ và tần suất vi phạm, các hình thức kỷ luật có thể bao gồm:</p>
<ul><li>Khiển trách bằng lời nói</li><li>Khiển trách bằng văn bản</li><li>Kéo dài thời hạn nâng lương (không quá 06 tháng)</li><li>Cách chức</li><li>Chấm dứt hợp đồng lao động (sa thải)</li></ul>
<p>Các hành vi vi phạm nghiêm trọng có thể dẫn đến chấm dứt hợp đồng lao động ngay lập tức mà không cần cảnh báo trước.</p>
<h4>8.5 Level 1 - Vi phạm nhẹ</h4>
<p>Vi phạm nhẹ là các hành vi có mức độ ảnh hưởng thấp, chưa gây tác động đáng kể đến hoạt động của Công ty nhưng cần được nhắc nhở và điều chỉnh. Ví dụ:</p>
<ul><li>Đi trễ hoặc về sớm mà không thông báo hợp lý</li><li>Không nộp báo cáo đúng hạn</li><li>Gây mất trật tự nhẹ tại nơi làm việc</li><li>Không tuân thủ các quy trình hoặc hướng dẫn cơ</li></ul>
<p>bản</p>
<ul><li>Sắp xếp nơi làm việc không gọn gàng, thiếu cẩn trọng</li></ul>
<p>với tài liệu</p>
<h4>8.6 Level 2 - Vi phạm trung bình</h4>
<p>Vi phạm trung bình bao gồm các hành vi vi phạm lặp lại hoặc bắt đầu ảnh hưởng đến hiệu quả công việc, kỷ luật và môi trường làm việc. Ví dụ:</p>
<ul><li>Không đáp ứng yêu cầu báo cáo hoặc KPI một cách lặp</li></ul>
<p>lại</p>
<ul><li>Nghỉ không phép (tối đa 1.5 ngày/tháng)</li><li>Không chấp hành chỉ đạo từ quản lý</li><li>Sử dụng thời gian làm việc cho việc cá nhân mà không</li></ul>
<p>được phép</p>
<ul><li>Hành vi không phù hợp ảnh hưởng đến đồng nghiệp hoặc</li></ul>
<p>môi trường làm việc</p>
<ul><li>Sử dụng tài sản Công ty sai mục đích</li></ul>
<h4>8.7 Level 3 - Vi phạm nghiêm trọng</h4>
<p>Vi phạm nghiêm trọng là các hành vi gây ảnh hưởng đáng kể đến hoạt động, uy tín, tài chính hoặc con người của Công ty. Ví dụ:</p>
<ul><li>Nghỉ không phép từ 2 đến 4.5 ngày/tháng</li><li>Có hành vi xúc phạm, lăng mạ hoặc thiếu tôn trọng đồng</li></ul>
<p>nghiệp/khách hàng</p>
<ul><li>Gây thiệt hại tài sản hoặc tổn thất tài chính cho Công ty</li><li>Vi phạm quy định về bảo mật thông tin</li><li>Lạm dụng chức vụ hoặc quyền hạn vì mục đích cá nhân</li><li>Gây ảnh hưởng nghiêm trọng đến trật tự và văn hóa</li></ul>
<p>doanh nghiệp</p>
<h4>8.8 Level 4 - Vi phạm đặc biệt nghiêm trọng</h4>
<p>Vi phạm đặc biệt nghiêm trọng là các hành vi có tính chất nghiêm trọng cao, làm mất niềm tin và có thể dẫn đến chấm dứt hợp đồng lao động ngay lập tức. Ví dụ:</p>
<ul><li>Trộm cắp, gian lận hoặc tham ô</li><li>Sử dụng, tàng trữ hoặc phân phối chất ma túy tại nơi</li></ul>
<p>làm việc</p>
<ul><li>Tiết lộ bí mật kinh doanh hoặc thông tin mật quan trọng</li><li>Hành vi bạo lực hoặc gây tổn hại nghiêm trọng</li><li>Vi phạm nghiêm trọng chính sách Công ty gây thiệt hại</li></ul>
<p>lớn</p>
<ul><li>Tự ý nghỉ việc từ 5 ngày trở lên mà không có lý do chính</li></ul>
<p>đáng</p>
<h4>8.9 Nguyên tắc bổ sung</h4>
<ul><li>Vi phạm lặp lại trong thời gian còn hiệu lực của kỷ luật sẽ</li></ul>
<p>bị nâng mức xử lý lên bậc cao hơn</p>
<ul><li>Mức độ nghiêm trọng và ảnh hưởng thực tế có thể được</li></ul>
<p>Offence / Mức sai phạm 1st occasion /  Lần 1 2nd occasion / Lần 2 3rd occasion / Lần 3</p>
<p>Cảnh cáo miệng</p>
<p>Cảnh cáo văn bản</p>
<p>Cảnh cáo văn bản cuối cùng</p>
<p>Cảnh cáo văn bản</p>
<p>Cảnh cáo văn bản cuối cùng</p>
<p>Cách chức/Giáng chức</p>
<p>Cách chức/Giáng chức</p>
<p>Kỷ luật sa thải</p>
<p>Kỷ luật sa thải xem xét để điều chỉnh hình thức kỷ luật</p>
<ul><li>Mọi quyết định kỷ luật phải tuân thủ quy trình và được</li></ul>
<p>lập thành văn bản</p>
<ul><li>Công ty có quyền quyết định hình thức xử lý cuối cùng</li></ul>
<h4>8.10 Mức độ kỷ luật</h4>' WHERE id = 'd2266c53-379a-4617-ac14-62cac6fa4369';
UPDATE code_of_conduct_sections SET content_en = '<p>While the operation of the Privacy Act does not apply to the employment relationship between the Employer and the individual and any employee record held by the Employer, The Employer treats the handling of your personal information very seriously. Accordingly, the purpose of this policy is to ensure the protection of your privacy in relation to the handling of your personal information.</p>
<h4>9.1 Collection of personal information</h4>
<p>Personal information may be collected during the recruiting process and throughout your employment with the Employer. This personal information may be disclosed to other areas within the business for administrative purposes and for the progression of your application. All confidential information will be used for legitimate purposes in accordance with relevant legislation. The Employee’s personal information includes information relating to:</p>
<ul><li>The engagement, training, disciplining or</li></ul>
<p>resignation</p>
<ul><li>Termination of the employment</li><li>Terms and conditions of employment</li><li>Personal and emergency contact details</li><li>Performance or conduct</li><li>Hours of employment, salary or wages</li><li>Membership of a professional or trade association or</li></ul>
<p>trade union membership</p>
<ul><li>Recreation, long service, sick, personal, maternity,</li></ul>
<p>paternity or other leave</p>
<ul><li>Taxation, banking or superannuation affairs</li></ul>
<p>You must ensure that any personal information provided is accurate and current.</p>
<h4>9.2 Your responsibility</h4>
<p>Every employee is responsible for the appropriate handling of such information and to prevent unlawful disclosure. If you have access to this information or any such personal information belonging to another employee or a client of the Employer, you must ensure that you maintain the confidence of the information that you have access to and prevent its unauthorised disclosure or use by any other person. Any action in breach of this policy may result in disciplinary action being taken.</p>', content_vi = '<p>Cho dù đạo luật về quyền cá nhân không đề cập đến mối quan hệ giữa chủ lao động với cá nhân hay hồ sơ của cá nhân do chủ lao động nắm giữ, công ty vẫn lưu giữ những dữ liệu cá nhân của bạn rất cẩn thận và nghiêm túc. Vì vậy, mục đích của chính sách này là để bảo đảm cho những thông tin cá nhân trong hồ sơ xin việc và sơ yếu lý lịch của bạn được giữ kín chặt chẽ.</p>
<h4>9.1 Thu thập thông tin cá nhân</h4>
<p>Trong quá trình tuyển dụng và trong suốt thời gian làm việc của bạn tại công ty, bạn được yêu cầu cung cấp những thông tin cá nhân cần thiết cho mục đích quản trị và hành chính. Những thông tin này sẽ được lưu trữ tại phòng quản lý nhân sự, sẽ được giữ kín và chỉ được sử dụng với những mục đích hợp pháp liên quan đến pháp lý nếu có. Thông tin cá nhân của bạn bao gồm những vấn đề liên quan đến:</p>
<ul><li>Các vấn đề liên quan đến việc tham gia các khoá đào</li></ul>
<p>tạo hoặc kết quả kỷ luật, đơn xin từ chức</p>
<ul><li>Quyết định kỷ luật thôi việc</li><li>Điều khoản và điều kiện làm việc</li><li>Thông tin liên lạc cá nhân và khẩn cấp</li><li>Bảng tính hiệu suất công việc</li><li>Giờ làm việc và bảng lương</li><li>Thông tin thành viên của bạn của các hiệp hội liên quan</li></ul>
<p>hoặc công đoàn</p>
<ul><li>Các thông tin về thâm niên làm việc, ngày nghỉ ốm, nghỉ</li></ul>
<p>thai sản, nghỉ phép năm</p>
<ul><li>Các thông tin về thuế thu nhập, ngân hàng hoặc các</li></ul>
<p>loại quỹ hưu trí, bảo hiểm Bạn cần bảo đảm những thông tin được gửi đến phòng lưu trữ của công ty phải chính xác và cập nhật.</p>
<h4>9.2 Trách nhiệm của nhân viên</h4>
<p>Mỗi nhân viên có trách nhiệm xử lý cẩn thận thông tin cá nhân và ngăn chặn việc tiết lộ bất hợp pháp. Nếu bạn có quyền truy cập vào thông tin của bất kỳ cá nhân nào trong công ty hoặc khách hàng, đối tác, bạn cần đảm bảo giữ kín và không sử dụng những thông tin này cho mục đích hoặc lợi ích cá nhân. Bất kỳ hành động nào vi phạm chính sách này sẽ được xử lý kỷ luật và tối đa có thể bị buộc thôi việc.</p>' WHERE id = '7235f4c5-f6ac-473f-b1e0-04e66691c0b0';
UPDATE code_of_conduct_sections SET content_en = '<h4>10.1 General requirement</h4>
<p>You may be required to use a motor vehicle to enable you to efficiently perform your duties. Where travelling in the course of duties, the motor vehicle is considered to be a workplace and the Employer recognises it has health and safety obligations in respect of this. The Employer will ensure that company motor vehicles are registered and insured in accordance with the relevant legislation. When driving a motor vehicle with Employer branding on display, you are representing the Employer at any time whilst driving or on the road. You must therefore drive in a manner that is considerate of other road users. Any complaint about a driver will be investigated and disciplinary action may result.</p>
<h4>10.2 Fixtures, fittings and modifications</h4>
<p>No fixtures such as aerials, roof racks, towing apparatus, or stickers may be attached to any Employer vehicles without prior written permission. No change or alterations may be made to the manufacturer’s mechanical or structural specification of the vehicle.</p>
<h4>10.3 Cleaning and Maintenance</h4>
<p>When driving one of the Employer’s vehicles, it is your responsibility to ensure that it is kept clean and tidy and free from rubbish and personal items at all times and that it is returned to the Employer in that condition after use. Smoking in Employer vehicles is not permitted. Any maintenance or repair work, or replacement of parts, including tyres, must be approved in advance by the Employer, and reimbursement will only be made against production of an authorisation. Full details of the work required and the cost involved including red invoice must be given. When requested by the Employer you must ensure servicing is carried out. Before use on its return, you are responsible for ensuring that the oil and water levels, battery and brake fluid and tyre pressures are maintained and that the tread of all tyres conforms to the minimum legal requirements. We reserves the right to request to deduct the cost from your pay where you fail to adequately clean the vehicle.</p>
<h4>10.5 Fines</h4>
<p>We will not be held responsible for any fines (eg parking, speeding, tolls etc) incurred by you whilst working for the Employer. If we receive the fine on your behalf, we may pay the fine and reserve the right to request to deduct the cost from any monies owing to you.</p>
<h4>10.5 Loss</h4>
<p>In the case of theft of one of the Employer’s vehicles, the police and the Employer must be informed immediately. Full details of the contents of the vehicle must also be given. If any contents are stolen from the vehicle, the police and the Employer should be notified immediately. Please note that only Employer property is insured by the Employer and it does not cover your personal belongings. You must always secure the vehicle and its contents, and turn on any alarm system that is fitted to the vehicle. The contents should be stored out of sight, preferably in the boot or rear. If a vehicle is stolen, we are required to prove to the insurance company that there has been no negligence and, therefore, we must hold you responsible in the event of such negligence.</p>
<h4>10.6 Permitted use</h4>
<p>Subject to the restrictions already stipulated, Employer vehicles may only be used for authorised business, unless previous arrangements for private domestic or social use have been agreed in advance. They may not be used for the carriage of passengers for hire or reward, nor may they be used for any type of motoring sport, including racing, rallying or pace making, whether on the public road or on private land. On periods of leave, you may be required to return the Employer vehicle to the Employer, unless otherwise agreed with management.</p>
<h4>10.6 Personal Liability</h4>
<p>In the event of an at fault accident whilst driving one of the Employer’s vehicles or where any damage to an Employer vehicle is due to your negligence or lack of care, the Employer reserves the right to insist on you rectifying the damage at your own expense or paying the excess part of any claim. Repeated instances may result in disciplinary action/and or the use of Employer vehicles being withdrawn.</p>', content_vi = '<h4>10.1 Yêu cầu chung</h4>
<p>Trong nhiều trường hợp bạn cần sử dụng các phương tiện cơ giới của công ty để hoàn thành công việc được giao. Khi tham gia giao thông trong giờ làm việc, phương tiện này cũng được coi như là nơi làm việc và bạn cần lưu ý đến nghĩa vụ bảo vệ an toàn và sức khoẻ cho bản thân, người đồng hành (nếu có) và người đi đường. Công ty sẽ đảm bảo rằng các phương tiện cơ giới của công ty đã được đăng ký và bảo hiểm theo quy định của pháp luật. Nếu lái xe có logo công ty, bạn đang đại diện cho thương hiệu và uy tín của công ty. Do đó, bạn cần cư xử lịch thiệp với người cùng tham gia giao thông. Đồng thời, công ty có nghĩa vụ đăng ký, đăng kiểm và mua bảo hiểm đầy đủ đối với những phương tiện cơ giới thuộc quyền sở hữu.</p>
<h4>10.2 Thay đổi hình dạng/kết cấu xe</h4>
<p>Bạn được yêu cầu không thay đổi hình dạng xe, ví dụ : gắn thêm đầu kéo, dán nhãn, sticker, v.v. lên xe mà chưa được sự phê duyệt của người quản lý bằng văn bản. Ngoài ra, mọi hành vi thay đổi cấu trúc xe liên quan đến máy móc và các thông số kỹ thuật của nhà máy đều bị nghiêm cấm.</p>
<h4>10.3 Giữ gìn vệ sinh và bảo dưỡng phương tiện</h4>
<p>Khi sử dụng một trong những phương tiện của công ty, trách nhiệm của bạn là giữ gìn vệ sinh chung, không vứt rác bừa bãi, để đồ cá nhân trên xe, không được hút thuốc trong xe và giữ nguyên hiện trạng này khi trả lại xe cho công ty. Nếu xe cần sửa chữa, bảo dưỡng, thay thế các bộ phận (bao gồm cả lốp xe), bạn cần được sự chấp thuận từ ban quản lý. Các hoạt động này phải được thực hiện ở một trong những cơ sở uy tín được cấp phép từ trước. Chi phí bồi hoàn sẽ chỉ được chi trả khi các đạt các điều kiện trên, và bạn được yêu cầu cung cấp hoá đơn đỏ, hoá đơn chi tiết và danh sách cụ thể các tác vụ được thực hiện từ cơ sở sửa chữa. Bạn cần đảm bảo hoàn thành đúng thời hạn các yêu cầu bảo trì, bảo dưỡng từ công ty. Khi nhận và trả xe lại cho công ty, bạn cần đảm bảo mức xăng, dầu, ắc quy, dầu phanh và áp suất lốp và bề mặt các lốp xe đạt chuẩn ở mức tối thiểu theo luật giao thông hiện hành và giống như khi bạn nhận xe. Công ty có quyền yêu cầu khấu trừ vào lương để bồi hoàn cho các vi phạm của bạn trong việc giữ gìn vệ sinh và bảo dưỡng phương tiện.</p>
<h4>10.4 Chi phí phạt khi vi phạm giao thông</h4>
<p>Công ty không chi trả cho bất kỳ chi phí phạt nào liên quan đến sự bất cẩn của bạn khi tham gia giao thông bằng xe công ty (ví dụ: phí cẩu xe, phạt đỗ xe, chạy quá tốc độ,...). Nếu nhận được biên bản phạt nào liên quan đến bạn, công ty có thể trả trước và sau đó khấu trừ vào tiền lương của bạn.</p>
<h4>10.5 Mất cắp</h4>
<p>Trong trường hợp xe bị mất cắp, bạn cần thông báo ngay lập tức đến công an, công ty và các bên có liên quan. Bạn được yêu cầu viết bản tường trình chi tiết về hoàn cảnh và lý do mất, đồng thời báo ngay với công ty về các tài sản bị mất trên xe. Lưu ý là bảo hiểm chỉ được đăng ký chi trả cho các loại tài sản của công ty và không bao gồm tài sản cá nhân của bạn. Công ty bảo hiểm chỉ chi trả khi công ty chứng minh được không có sự sơ xuất nào xảy ra khi xe đang tham gia giao thông. Do đó, bạn cần cẩn thận bảo đảm an toàn, không để những vật dụng quý giá ở nơi dễ thấy, khoá cửa xe và bật hệ thống báo động khi rời khỏi xe.</p>
<h4>10.6 Mục đích sử dụng</h4>
<p>Các phương tiện di chuyển của công ty chỉ được sử dụng cho mục đích kinh doanh trừ khi có thoả thuận trước đó cho các mục đích cá nhân hoặc xã hội. Bạn được yêu cầu không sử dụng các phương tiện này để chở khách thuê, chở hàng hoặc các mục đích cá nhân khác như đua xe, đua tốc độ, v.v. Trong thời gian nghỉ phép, bạn được yêu cầu hoàn trả lại xe cho công ty trừ khi có thoả thuận trước đó với ban quản lý.</p>
<h4>10.6 Nghĩa vụ cá nhân</h4>
<p>Trong trường hợp xảy ra tai nạn khi sử dụng một trong những phương tiện di chuyển của công ty, và điều này xảy ra do sự sơ xuất hoặc bất cẩn của bạn, công ty có quyền yêu cầu bạn bồi hoàn lại những chi phí vượt mức bảo hiểm, hoặc các chi phí khiếu nại. Nếu các trường hợp này lặp lại nhiều lần sẽ dẫn tới hình thức kỷ luật bao gồm buộc thôi việc và tịch thu lại phương tiện của công ty.</p>' WHERE id = 'e0173696-6189-416e-bae0-493a83654c87';
UPDATE code_of_conduct_sections SET content_en = '<p>v.v.</p>
<h4>11.1 General</h4>
<p>Management and employees alike must ensure:</p>
<ul><li>No plant, equipment or safety device (including PPE) is</li></ul>
<p>altered or removed from the workplace without express management authority</p>
<ul><li>All safety signs, policies and procedures are complied</li></ul>
<p>with in full</p>
<ul><li>Illegal drugs are not brought into, or used, in the</li></ul>
<p>workplace and</p>
<ul><li>Persons affected by alcohol or drugs are not permitted</li></ul>
<p>to access, or remain at, the workplace. You must ensure that you wear and use any personal protective equipment and clothing issued for your protection at all appropriate times.</p>
<h4>11.2 Housekeeping</h4>
<p>Failure to ensure that the workplace is kept neat and tidy may create unnecessary hazards. Management and employees alike are responsible for maintaining a neat and tidy workplace. This involves:</p>
<ul><li>Ensuring emergency exits, thoroughfares and</li></ul>
<p>pedestrian access points are not obstructed</p>
<ul><li>Ensuring aisles and work areas are clear and free from</li></ul>
<p>obstruction at all times so as not to cause additional hazards including slip, trip, or fall hazards</p>
<ul><li>Placing rubbish in the bins provided and</li><li>Ensuring all work, communal areas and facilities are</li></ul>
<p>kept clean and tidy at all times.</p>
<h4>11.3 Hygiene</h4>
<p>Any exposed cut or burn must be covered with a first-aid dressing. If you are suffering from an infectious or contagious disease or illness such as rubella or hepatitis you must not enter the workplace without clearance from your own doctor. Contact with any person suffering from an infectious or contagious disease must be reported before commencing work. If you go to work with poor health conditions that might be a risk to the community, company will send you home for an unpaid rest.</p>', content_vi = '<h4>11.1 Giới thiệu chung</h4>
<p>Quản lý và các nhân viên trong công ty cần đảm bảo rằng:</p>
<ul><li>Không có các dụng cụ hoặc thiết bị bảo hộ an toàn nào</li></ul>
<p>bị thay đổi hoặc tháo bỏ khỏi nơi làm việc mà không được sự cho phép hoặc phê duyệt từ công ty.</p>
<ul><li>Các bảng chỉ dẫn an toàn, chính sách và quy trình về an</li></ul>
<p>toàn lao động được tuân thủ nghiêm ngặt</p>
<ul><li>Không được mang ma tuý và các chất kích thích đến nơi</li></ul>
<p>làm việc</p>
<ul><li>Không được đến công ty nếu bạn đang bị ảnh hưởng bởi</li></ul>
<p>bia rượu hoặc chất kích thích Bạn cũng cần đảm bảo mặc trang phục bảo hộ lao động trong những khu vực yêu cầu trong thời gian làm việc.</p>
<h4>11.2 Giữ gìn vệ sinh</h4>
<p>Một môi trường làm việc bừa bãi, lộn xộn sẽ ảnh hưởng đến hiệu suất làm việc của bạn đồng thời mang lại những mối nguy hại khó lường. Vì thế, quản lý và các nhân viên cần tuân thủ những mục tiêu giữ gìn vệ sinh nơi làm việc bao gồm:</p>
<ul><li>Đảm bảo các lối thoát hiểm, cửa ra vào không bị cản</li></ul>
<p>trở</p>
<ul><li>Đảm bảo lối đi và khu vực làm việc luôn gọn gàng, ngăn</li></ul>
<p>nắp, tránh để vấp, trượt ngã, v.v.</p>
<ul><li>Bỏ rác vào thùng đúng nơi quy định</li><li>Giữ gọn gàng bàn làm việc, bàn máy tính, phòng họp,</li></ul>
<h4>11.3 Vấn đề sức khoẻ</h4>
<p>Những vết thương ngoài da, vết thương hở, vết bỏng, v.v. cần được sơ cứu và băng bó trước khi đến công ty. Nếu bạn đang mắc bệnh truyền nhiễm như rubella hoặc viêm gan, bạn không được đến chỗ làm khi chưa có sự cho phép của bác sĩ. Nếu bạn có tiếp xúc với người mắc bệnh truyền nhiễm, cần báo cáo với quản lý trước khi đi làm. Nếu bạn đi làm với tình trạng sức khoẻ không phù hợp và có thể mang lại rủi ro, lây nhiễm cho đồng nghiệp, công ty có thể cho bạn về nhà nghỉ ngơi mà không được trả lương.</p>' WHERE id = '9e980bd9-4588-476e-b903-e22d41a04bbe';
UPDATE code_of_conduct_sections SET content_en = '<p>Operation.</p>
<h4>12.1 Office area</h4>
<p>You must ensure:</p>
<ul><li>Working station is tidy and clean.</li><li>Documents must be stored in a personal drawer.</li></ul>
<p>Important confidential corporate documents must be stored in a locker or safe.</p>
<ul><li>Personal items must be left in the locker.</li><li>After work, just leave the calculator, pen holder and</li></ul>
<p>chairs neatly organised.</p>
<ul><li>Garbage bins in office areas let trash dry only. Wet</li></ul>
<p>garbage should be thrown in the trash in the pantry area.</p>
<ul><li>Be aware of general hygiene, not eating smelly foods</li></ul>
<p>during working hours.</p>
<h4>12.2 Showroom area</h4>
<p>You must ensure:</p>
<ul><li>Do not leave personal items in this area</li><li>After reception, clean the table and put the furniture in</li></ul>
<p>the correct position</p>
<ul><li>Do not arbitrarily reinforce or repair the product</li></ul>
<p>(including but not limited to replacing, replacing lenses, short cut aluminum trough, power connection) for the purpose of testing samples, presenting samples to customers, but not returning original status</p>
<ul><li>Do not open the sample cabinet or the cabinets</li></ul>
<p>belonged to another room to manage without permission from the department leader</p>
<ul><li>Do not arbitrarily bring company resources (including</li></ul>
<p>but not limited to products, accessories, publications, catalogues, product samples) out without sales order or transfering order from the department in charge</p>
<ul><li>Do not arbitrarily relocate resources in the showroom</li></ul>
<p>without permission from the IS/CS or Operation</p>
<ul><li>The sample cases should be neatly arranged in the pre-</li></ul>
<p>arranged area after returning the office</p>', content_vi = '<h4>12.1 Khu vực văn phòng</h4>
<p>Bạn cần đảm bảo:</p>
<ul><li>Giữ gìn bàn làm việc gọn gàng, sạch sẽ.</li><li>Các hồ sơ giấy tờ phải được cất vào hộc tủ cá nhân. Đối</li></ul>
<p>với các hồ sơ giấy tờ quan trọng của công ty cần được bảo mật phải cất vào ngăn tủ có khoá hoặc két sắt.</p>
<ul><li>Các vật dụng cá nhân phải để lại vào trong tủ locker.</li><li>Sau giờ làm việc, chỉ để lại máy tính, ống cắm bút và xếp</li></ul>
<p>gọn ghế.</p>
<ul><li>Thùng rác trong khu vực văn phòng chỉ để rác khô. Các</li></ul>
<p>loại rác uớt cần bỏ vào thùng rác ở khu vực pantry.</p>
<ul><li>Có ý thức giữ gìn vệ sinh chung, không ăn các loại thức</li></ul>
<p>ăn có mùi trong giờ làm việc.</p>
<h4>12.2 Khu vực showroom</h4>
<p>Bạn cần đảm bảo:</p>
<ul><li>Không để đồ cá nhân ở khu vực này.</li><li>Sau khi tiếp khách cần phải dọn dẹp bàn và để đồ đạc</li></ul>
<p>lại đúng vị trí cũ. Không được tự ý gia cố hoặc sửa chữa sản phẩm (bao gồm nhưng không giới hạn thay choá, thay mặt thấu kính, cắt ngắn máng nhôm, đấu nối nguồn) nhằm mục đích test mẫu, trình mẫu cho khách hàng, nhưng không trả về nguyên trạng.</p>
<ul><li>Không tự ý mở tủ mẫu hoặc các tủ thuộc phòng khác</li></ul>
<p>quản lý mà chưa được sự cho phép từ leader phòng.</p>
<ul><li>Không tự ý mang tài nguyên của công ty (bao gồm</li></ul>
<p>nhưng không giới hạn sản phẩm đèn, các loại phụ kiện, các ấn phẩm, catalogue, mẫu sản phẩm) ra ngoài mà không có phiếu xuất nhập kho hoặc sự đồng ý từ bộ phận phụ trách tài nguyên đó.</p>
<ul><li>Không được tự ý di dời vị trí tài nguyên trong showroom</li></ul>
<p>mà không được sự đồng ý từ Showroom Manager hoặc</p>
<ul><li>Các case mẫu sau khi đi tiếp khách về cần để gọn gàng</li></ul>
<p>ở khu vực được sắp xếp từ trước.</p>' WHERE id = '8aeed9b2-2e12-4992-b056-7bb41a79cfdb';
UPDATE code_of_conduct_sections SET content_en = '<h4>1.1 Introduction</h4>
<p>We recognise that bullying and harassment can exist in the workplace, as well as outside, and that this can seriously affect workers’ working lives by detracting from a productive working environment and can impact on the health, confidence, morale and performance of those affected by it, including anyone who witnesses or has knowledge of the unwanted or unacceptable behaviour.</p>
<h4>13.2 Harassment</h4>
<p>Harassment is any unwanted physical, verbal or non- verbal conduct based on grounds of age, disability, gender identity, marriage and civil partnership, pregnancy or maternity, race, religion or belief, sex or sexual orientation which affects the dignity of anyone at work or creates an intimidating, hostile, degrading, humiliating or offensive environment. Harassment can take many forms and individuals may not always realise that their behaviour constitutes harassment. Examples of harassment include:</p>
<ul><li>Insensitive jokes and pranks</li><li>Lewd or abusive comments about appearance</li><li>Deliberate exclusion from conversations</li><li>Displaying abusive or offensive writing or material</li><li>Unwelcome touching and</li><li>Abusive, threatening or insulting words or</li></ul>
<p>behaviour. These examples are not exhaustive and disciplinary action at the appropriate level will be taken against employees committing any form of harassment.</p>
<h4>13.3 Bullying</h4>
<p>Bullying is repeated, offensive, abusive, intimidating, insulting or unreasonable behaviour directed towards an individual or a group, which makes the recipient(s) feel threatened, humiliated or vulnerable. Bullying can be a form of harassment and can cause an individual to suffer negative physical and mental effects. As with harassment, there are many examples of bullying, which can include:</p>
<ul><li>Abusive, insulting or offensive language or</li></ul>
<p>comments</p>
<ul><li>Unjustified criticism or complaints</li></ul>
<p>ban</p>
<ul><li>Physical or emotional threats</li><li>Deliberate exclusion from workplace activities</li><li>The spreading of misinformation or malicious</li></ul>
<p>rumours</p>
<ul><li>The denial of access to information, supervision or</li></ul>
<p>resources such that it has a detrimental impact on the individual or group. These examples are not exhaustive and disciplinary action at the appropriate level will be taken against employees committing any form of bullying.</p>
<h4>13.4 Reasonable management action taken in a reasonable</h4>
<p>way It is reasonable for managers and supervisors to allocate work and to give fair and reasonable feedback on a worker’s performance. These actions are not considered to be workplace bullying or harassment if they are carried out lawfully and in a reasonable manner. Examples of reasonable management action can include but are not limited to:</p>
<ul><li>Setting reasonable performance goals, standards and</li></ul>
<p>deadlines</p>
<ul><li>Rostering and allocating working hours where the</li></ul>
<p>requirements are reasonable</p>
<ul><li>Transferring a worker for operational reasons</li><li>Deciding not to select a worker for promotion where a</li></ul>
<p>reasonable process is followed</p>
<ul><li>Informing a worker of their unsatisfactory work</li></ul>
<p>performance</p>
<ul><li>Informing a worker of their unreasonable or</li></ul>
<p>inappropriate behaviour in an objective and confidential way</p>
<ul><li>Implementing organisational changes or</li></ul>
<p>restructuring</p>
<ul><li>Taking disciplinary action including suspension or</li></ul>
<p>termination of employment</p>
<h4>13.5 Complaint procedures</h4>
<p><strong>i) Informal complaint</strong></p>
<p>We recognise that complaints of bullying, harassment, and particularly of sexual harassment, can sometimes be</p>
<p>of a sensitive or intimate nature and that it may not be appropriate for you to raise the issue through our normal grievance procedure. In these circumstances you are encouraged to raise such issues with a senior colleague of your choice (whether or not that person has a direct supervisory responsibility for you) as a confidential helper. If you are the victim of minor bullying or harassment you should make it clear to the alleged bully or harasser on an informal basis that their behaviour is unwelcome and ask the individual to stop. If you feel unable to do this verbally then you should hand a written request to the individual, and your confidential helper can assist you in this.</p>
<p><strong>ii) Formal complaint</strong></p>
<p>Where the informal approach fails or if the bullying or harassment is more serious, you should bring the matter to the attention of management as a formal written complaint and again your confidential helper can assist you in this. If possible, you should keep notes of the bullying or harassment so that the written complaint can include:</p>
<ul><li>The name of the alleged bully or harasser</li><li>The nature of the alleged incident of bullying or</li></ul>
<p>harassment</p>
<ul><li>The dates and times when the alleged incident of</li></ul>
<p>bullying or harassment occurred</p>
<ul><li>The names of any witnesses and</li><li>Any action already taken by you to stop the alleged</li></ul>
<p>bullying or harassment. On receipt of a formal complaint we will take action to separate you from the alleged bully or harasser to enable an uninterrupted investigation to take place. This may involve a temporary transfer of the alleged bully or harasser to another work area or suspension of employees (with contractual pay) until the matter has been resolved. The person dealing with the complaint will invite you to attend a meeting, at a reasonable time and location, to discuss the matter and carry out a thorough investigation. You have the right to be accompanied at such a meeting by your confidential helper or another work colleague of your choice and you must take all reasonable steps to attend. Those involved in the investigation will be expected to act in confidence and any breach of confidence will be a disciplinary matter.</p>
<p>On conclusion of the investigation which will normally be within ten working days of the meeting with you, a report of the findings and of the investigator’s decision will be sent, in writing, to you and to the alleged bully or harasser. If the report concludes that the allegation is well founded, appropriate action will be taken against the bully or harasser.If you bring a complaint of bullying or harassment you will not be victimised for having brought the complaint. However, if the report concludes that the complaint is both untrue and has been brought with malicious intent, appropriate action will be taken against you. Appropriate action in relation to an employee will include disciplinary action in accordance with the Employer’s disciplinary and disciplinary termination procedure. For other workers, appropriate action may include termination of their engagement with the Employer.</p>', content_vi = '<h4>13.1 Giới thiệu chung</h4>
<p>Công ty hiểu rằng nạn bắt nạt/quấy rối nơi công sở có thể tồn tại tiềm tàng, và điều này ảnh hưởng nghiêm trọng đến cuộc sống cũng như sự tự tin, sức khoẻ và hiệu suất làm việc của mỗi cá nhân. Vì thế, công ty có nghĩa vụ bảo đảm cho bạn một môi trường làm việc văn minh, công bằng, lành mạnh và an toàn, trong đó mọi người được đối xử với nhân phẩm và lòng tự trọng; và không có cá nhân hoặc nhóm nào cảm thấy bị bắt nạt, đe doạ hoặc cô lập.</p>
<h4>13.2 Quấy rối</h4>
<p>Quấy rối được coi là hành vi xâm phạm thể xác, ngôn ngữ hoặc phi ngôn ngữ dựa trên cơ sở tuổi tác, giới tính, khuyết tật, danh tính, đang trong thai kỳ, việc kết hôn hoặc quan hệ ngoài, tôn giáo, tín ngưỡng hoặc xu hướng tình dục, gây tổn hại đến lòng tự trọng của nạn nhân và tạo ra một môi trường đe doạ, xuống cấp, thù địch. Quấy rối có thể có nhiều hình thức khác nhau, và bản thân cá nhân không phải lúc nào cũng nhận ra hành vi của mình cấu thành quấy rối. Chẳng hạn như:</p>
<ul><li>Những trò đùa thiếu tế nhị</li><li>Những ý kiến mang khuynh hướng quấy rối và lạm dụng</li></ul>
<p>tình dục</p>
<ul><li>Gửi những văn bản, tin nhắn, tài liệu mang hàm ý quấy</li></ul>
<p>rối hoặc xúc phạm</p>
<ul><li>Cố tình đụng chạm nhạy cảm</li><li>Lời nói hoặc hành vi lăng mạ</li></ul>
<p>Danh sách này là chưa hoàn thiện và sẽ còn được bổ sung. Nếu trường hợp này xảy ra, các hình thức kỷ luật sẽ được áp dụng tuỳ thuộc vào mức độ sai phạm.</p>
<h4>13.3 Bắt nạt</h4>
<p>Bắt nạt là hành vi liên tục lạm dụng sức mạnh để đe doạ, xúc phạm, gây hấn, hoặc các hành động vô lý khiến nạn nhân hoặc một nhóm cá thể bị tổn thương, xúc phạm hoặc sỉ nhục. Bắt nạt trong công sở, dưới bất kỳ hình thức nào hoặc vì lý do gì, đều được xem là hành vi quấy rối mang lại những tác hại cả về mặt tâm lý lẫn thể chất đến nạn nhân. Những hành vi cấu thành việc bắt nạt bao gồm:</p>
<ul><li>Những bình luận có tính chất chỉ trích, lăng mạ hoặc xúc</li></ul>
<p>phạm kéo dài</p>
<ul><li>Các đánh giá hoặc khiếu nại bất công</li></ul>
<ul><li>Các đe doạ về cả thể chất lẫn tinh thần</li><li>Loại trừ ra khỏi các hoạt động đội, nhóm</li><li>Truyền bá thông tin không chính xác và tin đồn sai</li></ul>
<p>lệch</p>
<ul><li>Từ chối quyền thu thập thông tin hoặc các nguồn lực có</li></ul>
<p>ảnh hưởng hoặc tác động lớn đến công việc của nhóm hoặc cá thể Danh sách trên chưa hoàn thiện và sẽ còn được bổ sung. Nếu trường hợp này xảy ra, các hình thức kỷ luật sẽ được áp dụng tuỳ thuộc vào mức độ sai phạm.</p>
<h4>13.4 Sự phân bổ công việc từ ban quản lý</h4>
<p>Ban quản lý có nhiệm vụ phân bổ công việc hợp lý, công bằng và đưa ra những nhận xét phù hợp với hiệu suất và năng lực của nhân viên. Việc phân bổ này không được coi là bắt nạt hoặc quấy rối nơi làm việc nếu nó hợp pháp và phù hợp với chính sách của công ty. Những hành động phân bổ công việc hợp lý bao gồm:</p>
<ul><li>Thiết lập mục tiêu, hiệu quả tiêu chuẩn và thời hạn thực</li></ul>
<p>hiện công việc hợp lý</p>
<ul><li>Sắp xếp và phân bổ thời gian làm việc sao cho khối</li></ul>
<p>lượng công việc phù hợp</p>
<ul><li>Thuyên chuyển nhân lực đúng lý do, đúng thời điểm phục</li></ul>
<p>vụ cho hoạt động kinh doanh</p>
<ul><li>Đưa ra quyết định thăng chức hoặc không thăng chức</li></ul>
<p>theo đúng quy trình, quy chuẩn và thời hạn đánh giá mà công ty đặt ra</p>
<ul><li>Thông báo cho nhân viên về hiệu suất không đạt yêu</li></ul>
<p>cầu</p>
<ul><li>Thông báo cho nhân viên về những hành vi bất hợp lý</li></ul>
<p>hoặc không đúng chừng mực trong công sở một cách khách quan và riêng tư</p>
<ul><li>Thực hiện các thay đổi hoặc tái cấu trúc tổ chức, phòng</li></ul>
<ul><li>Thực hiện các mức kỷ luật bao gồm đình chỉ công tác</li></ul>
<p>hoặc cho thôi việc</p>
<h4>13.5 Quy trình tố cáo và khiếu nại</h4>
<p><strong>i) Khiếu nại không chính thức</strong></p>
<p>Công ty hiểu rằng những vấn đề quấy rối, bắt nạt trong công sở, đặc biệt là quấy rối tình dục, có thể mang tính chất nhạy</p>
<p>cảm và không phù hợp để bạn khiếu nại chính thức thông qua những thủ tục thông thường. Vì thế trong trường hợp này, công ty khuyến khích bạn nêu ra những vấn đề này một cách bí mật với những người quản lý cấp cao (có thể hoặc không phải là người quản lý trực tiếp của bạn) để giúp bạn như một người hỗ trợ viên bí mật. Nếu những quấy rối và bắt nạt này mang quy mô nhỏ, bạn nên nói rõ với kẻ gây rối trên cơ sở không chính thức rằng hành vi của họ là không mong muốn và yêu cầu được dừng lại. Nếu bạn không thể nói rõ trực tiếp, bạn có thể gửi email hoặc văn bản gợi ý sự trợ giúp từ người quản lý hoặc đồng nghiệp.</p>
<p><strong>ii) Khiếu nại chính thức</strong></p>
<p>Nếu việc khiếu nại không chính thức không có tác dụng, và vấn đề quấy rối này vẫn tiếp tục hoặc mang quy mô nghiêm trọng hơn, bạn có thể viết một bản khiếu nại chính thức và trình lên ban quản lý. Nếu được, bạn cần giải trình chi tiết về:</p>
<ul><li>Tên của kẻ gây rối hoặc kẻ bị cáo buộc gây rối</li><li>Bản chất của vụ việc</li><li>Ngày và nơi xảy ra vụ việc kể trên</li><li>Tên của nhân chứng (nếu có)</li><li>Những phản ứng của bạn, hoặc bất kỳ hành động nào</li></ul>
<p>bạn đã thực hiện để ngăn chặn việc quấy rối này. Khi nhận được cáo buộc của bạn, công ty sẽ tìm cách tách bạn ra khỏi kẻ bị cáo buộc gây rối và thực hiện một cuộc điều tra về vụ việc trên. Hành động này có thể bao gồm chuyển kẻ bị cáo buộc đến một khu vực làm việc khác hoặc đình chỉ công việc tạm thời (hưởng lương theo hợp đồng) cho đến khi mọi chuyện được giải quyết triệt để. Người phụ trách giải quyết vấn đề này sẽ mời bạn tham gia vào cuộc điều tra, với một thời gian và địa điểm phù hợp, để lấy lời khai và bối cảnh của vụ việc. Bạn được quyền dẫn theo một người hỗ trợ (ví dụ như luật sư hoặc người hỗ trợ bí mật là đồng nghiệp được bạn lựa chọn) và nhân chứng trong suốt quá trình này. Bạn, nhân chứng và các bên có liên quan phải đảm bảo tường thuật lại câu chuyện một cách xác thực và chi tiết. Những người liên quan đến cuộc điều tra này cần giữ bí mật tuyệt đối về vai trò của mình. Cuộc điều tra sẽ kéo dài nhất là 10 ngày làm việc, và sau đó mọi phán quyết từ công ty sẽ được gửi đến bạn và những người liên quan bằng văn bản.</p>
<p>Nếu cáo buộc của bạn là có cơ sở, công ty bảo đảm thực hiện những biện pháp thích hợp để kỷ luật kẻ gây rối. Mọi hành vi quấy rối và bắt nạt đều không được chấp nhận tại nơi làm việc và sẽ bị kỷ luật thích hợp và tối đa có thể bị đuổi việc. Đồng thời bạn cũng sẽ không chịu ảnh hưởng gì từ lời cáo buộc của mình. Ngược lại, nếu trong trường hợp bạn đưa ra những cáo buộc không đúng sự thật, công ty sẽ có những biện pháp kỷ luật đến bạn, bao gồm chấm dứt hợp đồng nếu sự việc gây nên ảnh hưởng nghiêm trọng đến uy tín cá nhân và doanh nghiệp. Những quyết định kỷ luật này sẽ được áp dụng dựa theo quy trình của công ty. Vì thế, bạn cần cân nhắc kỹ lưỡng trước khi đưa ra những khiếu nại và tuyệt đối không tố cáo vì mục đích hận thù cá nhân.</p>' WHERE id = 'a3f10e55-7899-40d3-95ac-48d450922444';
UPDATE code_of_conduct_sections SET content_en = '<h4>14.1 Illicit drugs and alcohol</h4>
<p>The use of drugs or alcohol jeopardises a safe workplace. The Employer recognises alcohol and other drug dependencies as treatable conditions, and encourages those persons who may be subject to such dependency to seek assistance from appropriate organisations or support groups. The Employer has a zero tolerance approach towards the presence of illicit drugs within the workplace. This includes the discovery of an employee with possession of an illicit substance, and any testing which results in a non-negative reading of a substance within an employee’s system above the detectable limit while at work. Employees are not permitted to work while under the influence of alcohol and must conduct themselves responsibly at all times. For the purposes of this policy and due to the nature of your work, if at any time you are required to operate vehicles, heavy or otherwise, machinery or other high risk work, the blood alcohol content limit is zero (0.00%). Alcohol may be consumed at some Employer events. Where this is the case, the Employer encourages responsible alcohol consumption and at no time should you be drunk or behave in a manner which is inappropriate. Non-compliance with this policy and any associated procedure by employees may result in disciplinary action up to and including termination.</p>
<h4>14.2 Screening</h4>
<p>The Employer may require screening for alcohol and drugs. For employees, this may include pre-employment testing. Testing may be conducted based on reasonable suspicion or following an incident or accident. The Employer reserves the right to carry out random testing across all levels of employees. The following provides examples of activities which may result in disciplinary procedures, up to and including termination of your employment or engagement with the Employer. If you:</p>
<ul><li>Are removed from the workplace due to impairment or</li></ul>
<p>reasonable suspicion of impairment</p>
<ul><li>Return a positive result following testing</li><li>Return a blood alcohol level of more than 0.00 or the</li></ul>
<p>equivalent in urine or breath samples</p>
<ul><li>Refuse reasonable direction to undertake drug and</li></ul>
<p>alcohol screening</p>
<ul><li>Are in possession of illegal drugs for supply or</li></ul>
<p>consumption in the workplace or the Employer’s vehicles. This list is not exhaustive. If you perform work on a client site which conducts regular or random drug and alcohol testing, you will be required to participate. Where you are suspected of being affected by drugs or alcohol, you may be required to participate in appropriate testing. If you return a positive result or refuse to participate in testing, you will be required to cease work immediately and leave the workplace. This time will be unpaid until such a time that you are fit to return to work. You will not be able to return to the workplace until you return a negative result.</p>
<h4>14.3 No smoking policy</h4>
<p>You are required to smoke only in designated smoking areas within the building or showroom. If you are working on a project site or any location outside the company premises, you must comply with the smoking regulations of that location. In addition, the company strictly prohibits smoking— including electronic cigarettes (e-cigarettes/vaping devices)—in the office, in company-owned vehicles, and in any areas where smoking is prohibited for occupational health and safety reasons.</p>', content_vi = '<h4>14.1 Chất kích thích và rượu bia</h4>
<p>Sử dụng chất kích thích hoặc lạm dụng rượu bia trong lúc làm việc ảnh hưởng nghiêm trọng đến sự an toàn lao động và môi trường làm việc. Công ty công nhận tình trạng phụ thuộc vào rượu và chất kích thích có thể điều trị được, và khuyến khích những cá nhân này tìm kiếm sự trợ giúp từ các tổ chức hoặc nhóm hỗ trợ thích hợp. Công ty sẽ không tha thứ cho sự hiện diện của các loại ma tuý và các chất kích thích tại nơi làm việc. Điều này bao gồm tàng trữ, mua bán, các xét nghiệm dương tính hoặc các chỉ số nồng độ vượt quá giới hạn cho phép trong thời gian bạn làm việc tại công ty. Ngoài ra, nhân viên không được đến nơi làm việc dưới ảnh hưởng của rượu bia và cần tự giác giữ trách nhiệm đối với vấn đề này. Nếu công việc cần vận hành các phương tiện cơ giới, máy móc hạng nặng hoặc mang tính rủi ro cao, nồng độ cồn trong máu phải nằm ở mức độ 0.00% Trong những sự kiện của công ty, bạn được khuyến khích uống rượu bia có trách nhiệm, không uống rượu khi lái xe và giữ kiểm soát hành vi trong phạm vi phù hợp. Nếu không tuân thủ theo quy tắc này, bạn sẽ bị kỷ luật bao gồm buộc thôi việc.</p>
<h4>14.2 Giám sát hoặc lục soát</h4>
<p>Công ty sẽ yêu cầu quyền giám sát hoặc lục soát bạn khi nghi ngờ bạn đang tàng trữ trái phép hoặc chịu ảnh hưởng của rượu bia hoặc các chất kích thích. Điều này bao gồm xét nghiệm máu của bạn trước khi tuyển dụng, hoặc tiến hành xét nghiệm dựa trên những nghi ngờ hợp lý sau khi xảy ra sự cố hoặc tai nạn. Công ty có quyền thực hiện những bài kiểm tra ngẫu nhiên trong thời gian làm việc. Những ví dụ về hành vi sau đây sẽ dẫn đến kỷ luật hoặc tối đa có thể bị buộc thôi việc:</p>
<ul><li>Khi được quản lý yêu cầu trở về nhà khi xét thấy bạn</li></ul>
<p>đang bị ảnh hưởng bởi rượu, bia hoặc chất kích thích</p>
<ul><li>Nhận kết quả dương tính với chất kích thích sau đợt xét</li></ul>
<p>nghiệm ngẫu nhiên của công ty</p>
<ul><li>Xét nghiệm máu, nước tiểu hoặc kết quả thổi nồng độ</li></ul>
<p>cồn hơn mức 0.00%</p>
<ul><li>Từ chối yêu cầu xét nghiệm máu hoặc nước tiểu hoặc từ</li></ul>
<p>chối yêu cầu lục soát từ công ty</p>
<ul><li>Tàng trữ, mua bán chất cấm, ma tuý trong công ty hoặc</li></ul>
<p>trên các phương tiện di chuyển của công ty Danh sách trên chưa hoàn thiện và sẽ còn được bổ sung. Bạn được yêu cầu hợp tác nếu có đợt kiểm tra nồng độ cồn và máu/nước tiểu ở các công trường, dự án của khách hàng. Công ty cũng yêu cầu sự hợp tác của bạn khi có đợt kiểm tra nồng độ cồn và máu/nước tiểu ở tại công ty hoặc khi có nghi ngờ bạn đang sử dụng các chất cấm này. Nếu kết qủa dương tính với ma tuý hoặc nồng đồ cồn trong máu vượt quá mức quy định, công ty sẽ yêu cầu bạn về nhà ngay lập tức và chỉ được phép đi làm lại cho đến khi bạn trình được chứng từ từ các cơ sở y tế có giấy phép rằng bạn đã có kết quả âm tính. Trong thời gian nghỉ, bạn sẽ không được trả lương.</p>
<h4>14.3 Quy định về việc hút thuốc lá</h4>
<p>Bạn được yêu cầu chỉ hút thuốc (bao gồm cả thuốc lá điện tử/vape) tại các khu vực hút thuốc được chỉ định trong tòa nhà hoặc showroom. Nếu bạn đang làm việc tại công trường dự án hoặc bất kỳ địa điểm nào ngoài công ty, bạn phải tuân thủ các quy định về hút thuốc tại nơi đó. Ngoài ra, công ty nghiêm cấm hút thuốc (bao gồm cả thuốc lá điện tử/vape) trong văn phòng, trong các phương tiện thuộc sở hữu của công ty, và tại bất kỳ khu vực nào cấm hút thuốc vì lý do an toàn lao động.</p>' WHERE id = '190d30c6-bc54-4338-9c07-a401a9c0d8b7';
UPDATE code_of_conduct_sections SET content_en = '<p>If you believe that the Employer or any of its officers or employees is involved in any form of wrongdoing such as:</p>
<ul><li>Committing a criminal offence</li><li>Failing to comply with a legal obligation</li><li>Endangering the health and safety of an individual</li><li>Environmental damage or</li><li>Concealing any information relating to the above</li></ul>
<p>You should, in the first instance, report your concerns to management who will treat the matter with complete confidence. If you are not satisfied with the explanation or reason given to you, you should raise the matter with the appropriate organisation or body, eg the police, the Environment Protection Agency or the health and safety regulator. You will not suffer any detriment as a result of any genuine attempt to bring to light matters of concern. However, if this procedure has not been invoked in good faith (eg for malicious reasons or in pursuit of a personal grudge), then you may be subject to disciplinary action up to and including termination.</p>', content_vi = '<p>Nếu bạn tin rằng công ty hoặc bất kỳ cá nhân nào đang làm việc tại công ty có liên quan đến bất kỳ hình thức sai phạm nào bao gồm :</p>
<ul><li>Phạm tội hình sự</li><li>Không tuân thủ pháp luật</li><li>Gây nguy hiểm cho sự an toàn hoặc sức khoẻ cá</li></ul>
<p>nhân</p>
<ul><li>Gây thiệt hại cho môi trường</li><li>Che giấu thông tin liên quan đến những vấn đề trên</li></ul>
<p>Bạn được yêu cầu báo cáo mối quan ngại của mình với quản lý. Nếu bạn không hài lòng với lời giải thích hoặc những lý do được đưa ra, bạn được quyền đưa ra vấn đề này với các tổ chức hoặc cơ quan thích hợp, ví dụ như cảnh sát, cơ quan quản lý môi trường hoặc các tổ chức bảo vệ sức khoẻ hoặc an toàn cá nhân. Bạn sẽ không chịu bất kỳ tổn hại nào do kết quả của việc tố cáo trên. Tuy nhiên, nếu những thủ tục này không được thực hiện một cách thiện chí vì lý do xung đột hoặc trả thù cá nhân, bạn có thể bị kỷ luật hoặc buộc thôi việc.</p>' WHERE id = '0c11fb9d-0974-4d15-8713-58dbae9f21e5';
UPDATE code_of_conduct_sections SET content_en = '<h4>16.1 Resignations</h4>
<p>All resignation requests must be submitted to Management in writing, clearly stating the reason for resignation and complying with the following notice periods:</p>
<ul><li>For indefinite-term labor contracts: at least 45 days’</li></ul>
<p>prior notice.</p>
<ul><li>For fixed-term labor contracts: at least 30 days’ prior</li></ul>
<p>notice.</p>
<ul><li>For labor contracts with a term of less than 12 months:</li></ul>
<p>at least 3 days’ prior notice.</p>
<h4>16.2 Termination your employment without notice</h4>
<p>If you terminate your employment without giving or working the required period of notice, as indicated in your contract of employment, you will have an amount equal to any additional cost of covering your duties during the notice period not worked deducted from any termination pay due to you. Under the 2019 Labor Code, in cases where an employee resigns without proper notice or fails to complete a full handover, the employee may be required to compensate the employer as follows:</p>
<ul><li>An amount equivalent to half a month’s salary as</li></ul>
<p>stated in the labor contract.</p>
<ul><li>An amount corresponding to the salary for the days of</li></ul>
<p>insufficient notice.</p>
<h4>16.3 Return of employer property</h4>
<p>On the termination of your employment, you must return all Employer property which is in your possession or for which you have responsibility. Failure to return such items within 7 days will result in the cost of the items being deducted from any monies outstanding to you.</p>
<h4>16.4 Hand-over Checklist</h4>
<p>You are required to make a handover form for the successor, including:</p>
<ul><li>Task Hand-over checklist</li><li>Equipment Hand-over checklist</li><li>Non-disclosure Agreement</li></ul>
<p>All handover forms should be completed correctly within 30 days or earlier. In the event that you are unable to complete these handover checklists within 30 days, the company will ask you to pay an amount of penalty to fill the lack of responsibility in your work. This amount may be deducted from any payments the company pays you.</p>', content_vi = '<h4>16.1 Đơn xin nghỉ việc</h4>
<p>Mọi đơn xin nghỉ việc phải được gửi đến Ban Quản lý bằng văn bản, nêu rõ lý do nghỉ việc và tuân thủ thời gian báo trước theo quy định như sau:</p>
<ul><li>Đối với hợp đồng lao động không xác định thời hạn: báo</li></ul>
<p>trước ít nhất 45 ngày.</p>
<ul><li>Đối với hợp đồng lao động xác định thời hạn: báo trước</li></ul>
<p>ít nhất 30 ngày.</p>
<ul><li>Đối với hợp đồng lao động có thời hạn dưới 12 tháng:</li></ul>
<p>báo trước ít nhất 03 ngày.</p>
<h4>16.2 Nghỉ việc không báo trước</h4>
<p>Nếu xin nghỉ việc mà không thông báo trước một khoảng thời gian như theo quy định của công ty, hoặc theo như thoả thuận trong hợp đồng, công ty yêu cầu bạn chi trả một số tiền để bổ sung cho sự thiếu trách nhiệm trong công việc của bạn. Khoản tiền này có thể sẽ bị khấu trừ trong khoản thanh toán công ty chưa chi trả cho bạn. Theo Bộ luật Lao động 2019, trong trường hợp người lao động nghỉ việc không báo trước hoặc không thực hiện đầy đủ nghĩa vụ bàn giao, người lao động có thể phải bồi thường cho người sử dụng lao động như sau:</p>
<ul><li>Một khoản tiền tương đương nửa tháng tiền lương theo</li></ul>
<p>Hợp đồng lao động.</p>
<ul><li>Một khoản tiền tương ứng với tiền lương của những ngày</li></ul>
<p>không báo trước.</p>
<h4>16.3 Trả lại tài sản thuộc sở hữu công ty</h4>
<p>Khi nghỉ việc, bạn được yêu cầu trả lại toàn bộ những trang thiết bị công ty cung cấp cho bạn trong quá trình làm việc. Quá trình này phải được thực hiện trong vòng 7 ngày. Sau khoảng thời gian này, nếu bạn vẫn chưa hoàn trả, công ty sẽ có biện pháp khấu trừ vào khoản thanh toán công ty chưa chi trả cho bạn.</p>
<h4>16.4 Biên bản bàn giao</h4>
<p>Bạn được yêu cầu lập một biên bản bản giao lại cho người kế nghiệm bao gồm:</p>
<ul><li>Biên bản bàn giao tác vụ</li><li>Biên bản bàn giao tài sản/công cụ</li><li>Cam kết bảo mật thông tin</li></ul>
<p>Các đề mục bàn giao cần được thực hiện đầy đủ và chính</p>
<p>xác trong thời hạn 30 ngày hoặc sớm hơn. Trong trường hợp bạn không thể hoàn thành đầy đủ các biên bản bàn giao này trong thời hạn 30 ngày, công ty sẽ yêu cầu bạn chi trả một số tiền để bổ sung cho sự thiếu trách nhiệm trong công việc của bạn. Khoản tiền này có thể sẽ bị khấu trừ trong khoản thanh toán công ty chưa chi trả cho bạn.</p>' WHERE id = '345e51cf-0ae6-498b-a930-b705cd59599b';

DELETE FROM code_of_conduct_sections WHERE id = '751e22f2-101e-4f62-988c-9a5a1211a39a';
ALTER TABLE code_of_conduct_sections DROP COLUMN content;

