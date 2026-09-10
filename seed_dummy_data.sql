-- =============================================================
-- Rlabz ERP - Full Dummy Data Seed Script (Schema-accurate)
-- Generated: September 2026
-- Usage: pipe to mysql or run via MySQL Workbench/phpMyAdmin
-- =============================================================
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = '';

TRUNCATE TABLE ssl_renewal_history; TRUNCATE TABLE student_hourly_rate_history;
TRUNCATE TABLE finance_settings; TRUNCATE TABLE faculty_payments;
TRUNCATE TABLE client_payments; TRUNCATE TABLE student_payments;
TRUNCATE TABLE invoices; TRUNCATE TABLE maintenance_support_charges;
TRUNCATE TABLE hosting_charges; TRUNCATE TABLE development_allocations;
TRUNCATE TABLE project_finances; TRUNCATE TABLE student_work_logs;
TRUNCATE TABLE student_reports; TRUNCATE TABLE student_profiles;
TRUNCATE TABLE faculty_profiles; TRUNCATE TABLE github_repositories;
TRUNCATE TABLE final_project_documents; TRUNCATE TABLE project_reports;
TRUNCATE TABLE certificates; TRUNCATE TABLE feedback;
TRUNCATE TABLE chat_messages; TRUNCATE TABLE chat_participants;
TRUNCATE TABLE chats; TRUNCATE TABLE meeting_participants;
TRUNCATE TABLE meeting_notes; TRUNCATE TABLE meetings;
TRUNCATE TABLE project_closures; TRUNCATE TABLE requirement_changes;
TRUNCATE TABLE client_requirements; TRUNCATE TABLE project_faculty;
TRUNCATE TABLE project_student; TRUNCATE TABLE notifications;
TRUNCATE TABLE audit_logs; TRUNCATE TABLE tasks;
TRUNCATE TABLE module_student; TRUNCATE TABLE modules;
TRUNCATE TABLE projects; TRUNCATE TABLE users;
TRUNCATE TABLE personal_access_tokens;

-- 1. USERS
INSERT INTO users (id,name,email,password,phone,role,permissions,created_at,updated_at) VALUES
(1,'Director Office','director@rajagiri.edu','$2y$10$NZ.unA.PDw6HppIkHgvc1OX/t.2mndZSWfO6KZPZpfGanjVcORia.','9800000001','director','[\"view-dashboard\", \"view-finance-readonly\", \"view-projects\", \"view-github\", \"view-audit-notifications\", \"project.assign_faculty\", \"project.view_global\", \"project.client_requirements.view\"]',NOW(),NOW()),
(2,'Sneha Nair (Coordinator)','coordinator@rajagiri.edu','$2y$10$jgp8JQQLmM51S6THInQOvOaHwOrzmHF3WTBjrXeJKBjIeY9elrWHG','9800000002','coordinator','[\"view-coordinator\", \"view-finance-readonly\", \"view-student\", \"view-projects\", \"view-communication\", \"view-github\", \"view-certificates\", \"project.create\", \"project.assign_students\", \"project.view_global\", \"project.client_requirements.create\", \"project.client_requirements.view\", \"project.client_requirements.update\", \"project.close\"]',NOW(),NOW()),
(3,'Rajan Pillai (Finance)','finance@rajagiri.edu','$2y$10$TxbECdrNYHO96jJpZgJTv.3iF6qBLD2lMJsnuoYciFc.TgDBaeYzW','9800000003','finance','[\"view-finance\", \"view-student-designations\", \"view-projects\"]',NOW(),NOW()),
(4,'Dr. Meena Raj (Faculty)','faculty@rajagiri.edu','$2y$10$W3mAIxp30hhNlShVEMfc7uBSEYhuAR5J4rfUGOJaLWkwFQAnqdfNm','9800000004','faculty','[\"view-faculty\", \"view-projects\", \"view-communication\", \"view-github\", \"project.view_assigned\", \"project.module.create\", \"project.task.create\", \"project.task.update\", \"project.submission.review\"]',NOW(),NOW()),
(5,'Dr. Joseph Thomas (Faculty)','joseph.thomas@rajagiri.edu','$2y$10$W3mAIxp30hhNlShVEMfc7uBSEYhuAR5J4rfUGOJaLWkwFQAnqdfNm','9800000005','faculty','[\"view-faculty\", \"view-projects\", \"view-communication\", \"view-github\", \"project.view_assigned\", \"project.module.create\", \"project.task.create\", \"project.task.update\", \"project.submission.review\"]',NOW(),NOW()),
(6,'Student Nova (Arjun)','nova@rajagiri.edu','$2y$10$XUANfOn2zoZLo4tKQ.S9.evYkwLys6Rmrk84fHq87V/29li1n668C','9800000006','student','[\"view-student\", \"view-projects\", \"view-communication\", \"view-github\", \"view-certificates-read\", \"project.view_assigned\", \"project.task.update\"]',NOW(),NOW()),
(7,'Student Orbit (Divya)','orbit@rajagiri.edu','$2y$10$XUANfOn2zoZLo4tKQ.S9.evYkwLys6Rmrk84fHq87V/29li1n668C','9800000007','student','[\"view-student\", \"view-projects\", \"view-communication\", \"view-github\", \"view-certificates-read\", \"project.view_assigned\", \"project.task.update\"]',NOW(),NOW()),
(8,'Student Spark (Rahul)','spark@rajagiri.edu','$2y$10$XUANfOn2zoZLo4tKQ.S9.evYkwLys6Rmrk84fHq87V/29li1n668C','9800000008','student','[\"view-student\", \"view-projects\", \"view-communication\", \"view-github\", \"view-certificates-read\", \"project.view_assigned\", \"project.task.update\"]',NOW(),NOW()),
(9,'Student Generic','student@rajagiri.edu','$2y$10$XUANfOn2zoZLo4tKQ.S9.evYkwLys6Rmrk84fHq87V/29li1n668C','9800000009','student','[\"view-student\", \"view-projects\", \"view-communication\", \"view-github\", \"view-certificates-read\", \"project.view_assigned\", \"project.task.update\"]',NOW(),NOW());

-- 2. PROJECTS
INSERT INTO projects (id,title,project_type,source_type,brought_by,client_name,contact_email,contact_phone,requirements,deliverables,expected_timeline,budget,priority,status,created_by,created_at,updated_at) VALUES
(1,'Hospital Management System','Web Application','external','John Abraham','MedCare Pvt Ltd','john@medcare.com','9900001111','Full HMS with patient records billing appointments','Web app plus Documentation','2026-12-31',250000.00,'urgent','in_progress',2,NOW(),NOW()),
(2,'College ERP Portal','Web Application','institution','Principal KV','MITS College','kv@mits.edu.in','9900002222','Student faculty and admin management portal','Web portal plus Admin dashboard','2026-11-30',180000.00,'normal','in_progress',2,NOW(),NOW()),
(3,'Alumni Networking Platform','Web Application','alumni','Asha Varma','MITS Alumni Assoc','asha@alumni.in','9900003333','Platform to connect alumni with students','Social platform plus Job board','2026-10-15',120000.00,'normal','proposed',2,NOW(),NOW()),
(4,'Inventory Tracker App','Mobile App','student','Arjun Menon','Local Retail Co','contact@retail.in','9900004444','Track stock and sales for retail store','Android App plus Backend API','2026-09-30',80000.00,'normal','accepted',2,NOW(),NOW()),
(5,'Faculty Research Portal','Web Application','faculty','Dr. Meena Raj','MITS College','kv@mits.edu.in','9900005555','Portal for faculty to submit and track research papers','Web portal plus Document upload','2027-03-31',95000.00,'normal','closed',2,NOW(),NOW());

-- 3. MODULES
INSERT INTO modules (id,project_id,weight_percentage,module_name,description,status,created_by,created_at,updated_at) VALUES
(1,1,25.00,'User Authentication','Login registration and role management','completed',2,NOW(),NOW()),
(2,1,35.00,'Patient Management','Add edit patients medical history and records','in_progress',2,NOW(),NOW()),
(3,1,40.00,'Billing and Payments','Invoice generation and payment tracking','not_started',2,NOW(),NOW()),
(4,2,30.00,'Student Module','Student registration marks and attendance','in_progress',2,NOW(),NOW()),
(5,2,30.00,'Faculty Module','Faculty profile schedule and grading','in_progress',2,NOW(),NOW()),
(6,2,40.00,'Admin Dashboard','Reports analytics and configuration','not_started',2,NOW(),NOW()),
(7,4,50.00,'Inventory Core','Product listing and stock tracking','in_progress',2,NOW(),NOW()),
(8,4,50.00,'Sales and Reports','Sales recording and reporting dashboard','not_started',2,NOW(),NOW()),
(9,5,100.00,'Research Paper Portal','Submit track and review research papers','completed',2,NOW(),NOW());

-- 4. MODULE_STUDENT
INSERT INTO module_student (id,module_id,student_id,assigned_date,created_at,updated_at) VALUES
(1,1,6,'2026-01-15',NOW(),NOW()),(2,2,6,'2026-01-15',NOW(),NOW()),
(3,2,7,'2026-01-20',NOW(),NOW()),(4,4,7,'2026-02-01',NOW(),NOW()),
(5,5,8,'2026-02-01',NOW(),NOW()),(6,7,8,'2026-03-01',NOW(),NOW());

-- 5. TASKS
INSERT INTO tasks (id,module_id,title,description,assigned_to,status,due_date,reviewed_by,review_status,reviewed_at,created_by,created_at,updated_at) VALUES
(1,1,'Design login page UI','Create login and registration screens',6,'completed','2026-02-10',4,'approved','2026-02-12 10:00:00',2,NOW(),NOW()),
(2,1,'Implement JWT auth','Set up JWT token auth for API',6,'completed','2026-02-20',4,'approved','2026-02-22 14:00:00',2,NOW(),NOW()),
(3,2,'Patient registration form','Build patient intake form with validations',6,'in_progress','2026-03-15',NULL,NULL,NULL,2,NOW(),NOW()),
(4,2,'Medical history module','Store and retrieve patient history',7,'todo','2026-03-30',NULL,NULL,NULL,2,NOW(),NOW()),
(5,3,'Invoice generation','Auto-generate PDF invoices',NULL,'todo','2026-04-15',NULL,NULL,NULL,2,NOW(),NOW()),
(6,4,'Student registration CRUD','API endpoints for student management',7,'in_progress','2026-03-10',5,'pending',NULL,2,NOW(),NOW()),
(7,5,'Faculty schedule page','Weekly schedule view for faculty',8,'todo','2026-03-20',NULL,NULL,NULL,2,NOW(),NOW()),
(8,7,'Product listing API','REST API to list and filter products',8,'in_progress','2026-03-25',NULL,NULL,NULL,2,NOW(),NOW()),
(9,9,'Paper submission form','Upload and submit research papers',6,'completed','2026-01-30',4,'approved','2026-02-01 09:00:00',2,NOW(),NOW()),
(10,9,'Review workflow','Multi-stage review process for papers',7,'completed','2026-02-15',4,'approved','2026-02-18 11:00:00',2,NOW(),NOW());

-- 6. AUDIT_LOGS
INSERT INTO audit_logs (id,user_id,action,description,created_at) VALUES
(1,1,'user_login','Director logged in from 192.168.1.1',NOW()),
(2,2,'project_created','Coordinator created project: Hospital Management',NOW()),
(3,2,'student_assigned','Student Arjun Menon assigned to HMS project',NOW()),
(4,4,'task_reviewed','Faculty reviewed task: Design login page UI',NOW()),
(5,6,'task_submitted','Student submitted task for review',NOW()),
(6,3,'invoice_created','Finance created invoice INV-2026-001',NOW());

-- 7. NOTIFICATIONS
INSERT INTO notifications (id,user_id,type,message,is_read,created_at,updated_at) VALUES
(1,6,'task_assigned','You have been assigned a new task: Design login page UI',1,NOW(),NOW()),
(2,7,'task_assigned','You have been assigned: Medical history module',0,NOW(),NOW()),
(3,4,'task_review','Task submitted for review: Patient registration form',0,NOW(),NOW()),
(4,2,'project_update','Project Hospital Management has been updated',1,NOW(),NOW()),
(5,8,'task_assigned','You have been assigned: Faculty schedule page',0,NOW(),NOW()),
(6,6,'report_approved','Your weekly report has been approved',1,NOW(),NOW());

-- 8. PROJECT_STUDENT
INSERT INTO project_student (id,project_id,student_id,role,assigned_date,created_at,updated_at) VALUES
(1,1,6,'project_lead','2026-01-10',NOW(),NOW()),(2,1,7,'developer','2026-01-15',NOW(),NOW()),
(3,2,7,'developer','2026-02-01',NOW(),NOW()),(4,2,8,'designer','2026-02-05',NOW(),NOW()),
(5,4,8,'project_lead','2026-03-01',NOW(),NOW()),(6,5,6,'developer','2025-09-01',NOW(),NOW());

-- 9. PROJECT_FACULTY
INSERT INTO project_faculty (id,project_id,faculty_id,assigned_date,created_at,updated_at) VALUES
(1,1,4,'2026-01-10',NOW(),NOW()),(2,2,5,'2026-02-01',NOW(),NOW()),
(3,4,4,'2026-03-01',NOW(),NOW()),(4,5,4,'2025-09-01',NOW(),NOW());

-- 10. CLIENT_REQUIREMENTS
INSERT INTO client_requirements (id,title,description,status,created_at,updated_at) VALUES
(1,'Patient Aadhaar verification','System must verify patient identity using Aadhaar during registration','new',NOW(),NOW()),
(2,'Multi-language support','Application should support English and Malayalam','in_progress',NOW(),NOW()),
(3,'Mobile responsive design','All screens must be usable on mobile devices','new',NOW(),NOW()),
(4,'Student bulk import via Excel','Admin can import student data from Excel file','new',NOW(),NOW()),
(5,'Offline mode for inventory app','App should work without internet and sync when connected','in_progress',NOW(),NOW());

-- 11. REQUIREMENT_CHANGES
INSERT INTO requirement_changes (id,client_requirement_id,previous_value,updated_value,changed_by,created_at,updated_at) VALUES
(1,2,'Support only English','Support English and Malayalam',2,NOW(),NOW()),
(2,5,'Offline mode optional','Offline mode is mandatory - core feature',2,NOW(),NOW());

-- 12. PROJECT_CLOSURES
INSERT INTO project_closures (id,project_id,closed_by,closure_date,final_status,remarks) VALUES
(1,5,1,'2026-08-01 10:00:00','completed','Project delivered successfully. Client signed off. All documents handed over.');

-- 13. FACULTY_PROFILES
INSERT INTO faculty_profiles (id,faculty_id,department,designation,created_at,updated_at) VALUES
(1,4,'Computer Science and Engineering','Associate Professor',NOW(),NOW()),
(2,5,'Information Technology','Assistant Professor',NOW(),NOW());

-- 14. STUDENT_PROFILES
INSERT INTO student_profiles (id,student_id,course,batch,semester,designation,created_at,updated_at) VALUES
(1,6,'B.Tech Computer Science','2023-27',6,'orbit',NOW(),NOW()),
(2,7,'B.Tech Information Technology','2023-27',6,'nova',NOW(),NOW()),
(3,8,'B.Tech Computer Science','2024-28',4,'spark',NOW(),NOW());

-- 15. STUDENT_REPORTS
INSERT INTO student_reports (id,student_id,project_id,report_type,report_date,work_done,report_file,approval_status,feedback,submitted_at,created_at,updated_at) VALUES
(1,6,1,'daily','2026-09-01','Completed login page UI design. All input validations added. Pushed to GitHub.',NULL,'approved','Good progress','2026-09-01 18:00:00',NOW(),NOW()),
(2,6,1,'weekly','2026-09-07','This week: Implemented JWT auth, tested all endpoints, fixed 3 bugs.',NULL,'approved','Well done','2026-09-07 18:00:00',NOW(),NOW()),
(3,7,1,'daily','2026-09-02','Started medical history module. Created DB schema and basic CRUD APIs.',NULL,'pending',NULL,'2026-09-02 18:30:00',NOW(),NOW()),
(4,8,2,'daily','2026-09-03','Worked on faculty schedule page layout. Completed responsive grid component.',NULL,'approved','Nicely formatted','2026-09-03 19:00:00',NOW(),NOW()),
(5,8,4,'weekly','2026-09-07','Built product listing API with pagination and filters. Unit tests written.',NULL,'pending',NULL,'2026-09-07 17:00:00',NOW(),NOW());

-- 16. STUDENT_WORK_LOGS
INSERT INTO student_work_logs (id,project_student_id,task_id,work_date,hours_worked,description,approval_status,approved_by,approved_at,created_at,updated_at) VALUES
(1,1,1,'2026-02-08',3.50,'Designed login and registration page mockups in Figma','approved',4,'2026-02-10 09:00:00',NOW(),NOW()),
(2,1,1,'2026-02-09',4.00,'Converted Figma designs to React components','approved',4,'2026-02-10 09:30:00',NOW(),NOW()),
(3,1,2,'2026-02-18',5.00,'Implemented JWT middleware and token refresh logic','approved',4,'2026-02-20 10:00:00',NOW(),NOW()),
(4,2,3,'2026-09-02',4.50,'Created patient registration form with Aadhaar validation','pending',NULL,NULL,NOW(),NOW()),
(5,3,6,'2026-09-02',3.00,'Built student registration API endpoints','pending',NULL,NULL,NOW(),NOW()),
(6,5,8,'2026-09-03',5.50,'Developed product listing REST API with filters','pending',NULL,NULL,NOW(),NOW());

-- 17. PROJECT_FINANCES
INSERT INTO project_finances (id,project_id,total_development_amount,gst_percentage,created_by,approved_by,approved_at,status,created_at,updated_at) VALUES
(1,1,212000.00,18.00,3,1,'2026-01-20 11:00:00','approved',NOW(),NOW()),
(2,2,152542.00,18.00,3,1,'2026-02-10 11:00:00','approved',NOW(),NOW()),
(3,4,67797.00,18.00,3,NULL,NULL,'draft',NOW(),NOW()),
(4,5,80508.00,18.00,3,1,'2025-10-01 11:00:00','approved',NOW(),NOW());

-- 18. DEVELOPMENT_ALLOCATIONS
INSERT INTO development_allocations (id,project_finance_id,category,amount,created_at,updated_at) VALUES
(1,1,'student',75000.00,NOW(),NOW()),
(2,1,'faculty',50000.00,NOW(),NOW()),
(3,1,'rlabz',125000.00,NOW(),NOW()),
(4,2,'student',54000.00,NOW(),NOW()),
(5,2,'faculty',36000.00,NOW(),NOW()),
(6,2,'rlabz',90000.00,NOW(),NOW()),
(7,3,'student',24000.00,NOW(),NOW()),
(8,3,'rlabz',56000.00,NOW(),NOW()),
(9,4,'student',28500.00,NOW(),NOW()),
(10,4,'faculty',19000.00,NOW(),NOW()),
(11,4,'rlabz',47500.00,NOW(),NOW());

-- 19. HOSTING_CHARGES
INSERT INTO hosting_charges (id,project_finance_id,charge_type,amount,purchase_date,expiry_date,reference_details,created_at,updated_at) VALUES
(1,1,'hosting',12000.00,'2026-01-10','2027-01-10','AWS EC2 t3.medium hosting for medcarehms.com',NOW(),NOW()),
(2,1,'ssl',3500.00,'2026-01-10','2027-01-15','Comodo SSL certificate for medcarehms.com',NOW(),NOW()),
(3,1,'domain',1200.00,'2026-01-10','2027-01-10','medcarehms.com domain renewal via GoDaddy',NOW(),NOW()),
(4,2,'hosting',8000.00,'2026-02-01','2027-02-01','DigitalOcean Droplet staging and production',NOW(),NOW()),
(5,2,'ssl',2500.00,'2026-01-28','2027-02-01','Wildcard SSL certificate for *.mits.edu.in',NOW(),NOW()),
(6,3,'hosting',4000.00,'2026-03-01','2027-03-01','Linode VPS hosting for inventory app API backend',NOW(),NOW());

-- 20. MAINTENANCE_SUPPORT_CHARGES
INSERT INTO maintenance_support_charges (id,project_finance_id,amount,start_date,end_date,description,created_at,updated_at) VALUES
(1,1,25000.00,'2026-01-01','2026-12-31','Annual maintenance: bug fixes minor enhancements and server monitoring',NOW(),NOW()),
(2,4,10000.00,'2026-08-01','2027-07-31','Post-launch support: 3 months warranty plus 9 months AMC',NOW(),NOW());

-- 21. INVOICES
INSERT INTO invoices (id,project_finance_id,invoice_number,invoice_date,due_date,amount_before_gst,gst_percentage,description,created_by,created_at,updated_at) VALUES
(1,1,'INV-2026-001','2026-01-25','2026-02-25',100000.00,18.00,'Advance payment 40 percent of total development cost - HMS project',3,NOW(),NOW()),
(2,1,'INV-2026-002','2026-04-01','2026-05-01',75000.00,18.00,'Second milestone: Patient management module completion',3,NOW(),NOW()),
(3,2,'INV-2026-003','2026-02-15','2026-03-15',90000.00,18.00,'Advance 50 percent for College ERP Portal project',3,NOW(),NOW()),
(4,4,'INV-2025-010','2025-09-15','2025-10-15',47500.00,18.00,'Research portal project 50 percent advance',3,NOW(),NOW()),
(5,4,'INV-2025-015','2026-07-01','2026-07-31',47500.00,18.00,'Research portal project 50 percent final payment on delivery',3,NOW(),NOW());

-- 22. STUDENT_PAYMENTS
INSERT INTO student_payments (id,project_student_id,designation,approved_hours,hourly_rate,amount,payment_date,created_at,updated_at) VALUES
(1,1,'orbit',40.00,150.00,6000.00,'2026-03-05',NOW(),NOW()),
(2,1,'orbit',35.00,150.00,5250.00,'2026-04-05',NOW(),NOW()),
(3,2,'nova',30.00,100.00,3000.00,'2026-03-05',NOW(),NOW()),
(4,3,'nova',25.00,100.00,2500.00,'2026-03-05',NOW(),NOW()),
(5,6,'orbit',80.00,150.00,12000.00,'2026-01-05',NOW(),NOW()),
(6,6,'orbit',90.00,150.00,13500.00,'2026-02-05',NOW(),NOW());

-- 23. CLIENT_PAYMENTS
INSERT INTO client_payments (id,invoice_id,amount,payment_date,payment_method,payment_reference,remarks,recorded_by,created_at,updated_at) VALUES
(1,1,118000.00,'2026-02-01','NEFT','TXN20260201HMS001','Advance payment received. Amount includes 18 percent GST.',3,NOW(),NOW()),
(2,3,106200.00,'2026-02-20','RTGS','TXN20260220ERP001','Advance for ERP project. GST inclusive.',3,NOW(),NOW()),
(3,4,56050.00,'2025-09-20','NEFT','TXN20250920RES001','Advance payment for research portal.',3,NOW(),NOW()),
(4,5,56050.00,'2026-07-10','UPI','TXN20260710RES002','Final payment received on completion.',3,NOW(),NOW());

-- 24. FACULTY_PAYMENTS
INSERT INTO faculty_payments (id,project_faculty_id,amount,payment_date,status,created_at,updated_at) VALUES
(1,1,15000.00,'2026-03-31','paid',NOW(),NOW()),
(2,1,15000.00,'2026-06-30','paid',NOW(),NOW()),
(3,2,12000.00,'2026-04-30','paid',NOW(),NOW()),
(4,4,19000.00,'2026-08-05','paid',NOW(),NOW()),
(5,3,8000.00,'2026-05-31','processing',NOW(),NOW());

-- 25. FINANCE_SETTINGS
INSERT INTO finance_settings (id,student_hourly_rate,created_at,updated_at) VALUES
(1,150.00,NOW(),NOW());

-- 26. STUDENT_HOURLY_RATE_HISTORY
INSERT INTO student_hourly_rate_history (id,old_rate,new_rate,updated_by,created_at,updated_at) VALUES
(1,100.00,120.00,1,'2026-04-01 10:00:00','2026-04-01 10:00:00'),
(2,120.00,150.00,1,'2026-07-01 10:00:00','2026-07-01 10:00:00');

-- 27. SSL_RENEWAL_HISTORY
INSERT INTO ssl_renewal_history (id,hosting_charge_id,renewal_date,previous_expiry_date,new_expiry_date,renewal_amount,payment_reference,remarks,renewed_by,created_at,updated_at) VALUES
(1,2,'2026-01-10',NULL,'2027-01-15',3500.00,'SSL-PAY-2026-001','First SSL purchase for medcarehms.com',3,NOW(),NOW()),
(2,5,'2026-01-28',NULL,'2027-02-01',2500.00,'SSL-PAY-2026-002','SSL for mits-erp project domain',3,NOW(),NOW());

-- 28. CERTIFICATES
INSERT INTO certificates (id,project_id,student_id,certificate_number,description,issue_date,certificate_file,issued_by) VALUES
(1,5,6,'RLABZ-CERT-2026-001','Certificate of Completion for Research Paper Portal module development','2026-08-05','certificates/cert_arjun_research.pdf',1),
(2,5,7,'RLABZ-CERT-2026-002','Certificate of Appreciation for Research Paper Portal review workflow','2026-08-05','certificates/cert_divya_research.pdf',1),
(3,1,6,'RLABZ-CERT-2026-003','Module Completion Certificate for Authentication Module in HMS','2026-03-01','certificates/cert_arjun_hms_auth.pdf',2);

-- 29. CHATS
INSERT INTO chats (id,project_id,title,created_by,is_active,created_at,updated_at) VALUES
(1,1,'Hospital Management General Chat',2,1,NOW(),NOW()),
(2,2,'College ERP Discussion',2,1,NOW(),NOW()),
(3,4,'Inventory Tracker App Team',2,1,NOW(),NOW()),
(4,5,'Faculty Research Portal Archive',2,0,NOW(),NOW());

-- 30. CHAT_PARTICIPANTS
INSERT INTO chat_participants (id,chat_id,user_id,joined_at,created_at,updated_at) VALUES
(1,1,2,NOW(),NOW(),NOW()),
(2,1,4,NOW(),NOW(),NOW()),
(3,1,6,NOW(),NOW(),NOW()),
(4,1,7,NOW(),NOW(),NOW()),
(5,2,2,NOW(),NOW(),NOW()),
(6,2,5,NOW(),NOW(),NOW()),
(7,2,7,NOW(),NOW(),NOW()),
(8,2,8,NOW(),NOW(),NOW()),
(9,3,2,NOW(),NOW(),NOW()),
(10,3,4,NOW(),NOW(),NOW()),
(11,3,8,NOW(),NOW(),NOW()),
(12,4,2,NOW(),NOW(),NOW()),
(13,4,4,NOW(),NOW(),NOW()),
(14,4,6,NOW(),NOW(),NOW());

-- 31. CHAT_MESSAGES
INSERT INTO chat_messages (id,chat_id,sender_id,message,created_at,updated_at) VALUES
(1,1,2,'Welcome team to Hospital Management System project!',NOW(),NOW()),
(2,1,4,'Please make sure the UI adheres to the design specifications.',NOW(),NOW()),
(3,1,6,'Understood Dr. Meena, login screens are already completed and pushed.',NOW(),NOW()),
(4,1,7,'I am starting the patient registration form today.',NOW(),NOW()),
(5,2,2,'College ERP module division is finalized. Check tasks page.',NOW(),NOW()),
(6,2,8,'Working on faculty schedule layout now.',NOW(),NOW()),
(7,3,8,'Inventory Core API is nearly 80% done.',NOW(),NOW());

-- 32. MEETINGS
INSERT INTO meetings (id,project_id,title,scheduled_at,location,meeting_link,agenda,status,created_by,created_at,updated_at) VALUES
(1,1,'HMS Kickoff Meeting','2026-01-10 10:00:00','Conference Room A','https://meet.google.com/abc-defg-hij','Project scope architecture and student allocations','completed',2,NOW(),NOW()),
(2,1,'HMS Sprint 2 Review','2026-02-25 14:00:00','Online','https://meet.google.com/hms-rev2-meet','Review authentication module and demo login API','completed',2,NOW(),NOW()),
(3,2,'College ERP Progress Review','2026-03-15 11:00:00','Lab 302','https://meet.google.com/erp-prog-meet','Discuss student and faculty modules progress','scheduled',2,NOW(),NOW()),
(4,4,'Inventory App Architecture Sync','2026-03-20 15:30:00','Online','https://meet.google.com/inv-arch-sync','Discuss offline sync and sqlite storage on mobile','scheduled',2,NOW(),NOW()),
(5,5,'Final Closure Sign-off','2026-08-01 09:30:00','Board Room','https://meet.google.com/res-close-meet','Client handover and project formal closure','completed',1,NOW(),NOW());

-- 33. MEETING_PARTICIPANTS
INSERT INTO meeting_participants (id,meeting_id,user_id,attendance_status,created_at,updated_at) VALUES
(1,1,2,'attended',NOW(),NOW()),
(2,1,4,'attended',NOW(),NOW()),
(3,1,6,'attended',NOW(),NOW()),
(4,1,7,'attended',NOW(),NOW()),
(5,2,4,'attended',NOW(),NOW()),
(6,2,6,'attended',NOW(),NOW()),
(7,3,2,'invited',NOW(),NOW()),
(8,3,5,'invited',NOW(),NOW()),
(9,3,7,'invited',NOW(),NOW()),
(10,3,8,'invited',NOW(),NOW()),
(11,4,4,'invited',NOW(),NOW()),
(12,4,8,'invited',NOW(),NOW()),
(13,5,1,'attended',NOW(),NOW()),
(14,5,4,'attended',NOW(),NOW()),
(15,5,6,'attended',NOW(),NOW());

-- 34. MEETING_NOTES
INSERT INTO meeting_notes (id,meeting_id,`minutes`,`important_decisions`,uploaded_by,uploaded_on) VALUES
(1,1,'Discussed core architecture and database modeling. Assigned authentication to Arjun Menon and patient registration to Divya Krishnan.','Adopted Laravel REST API + React frontend architecture. Approved 3-month milestone plan.',2,'2026-01-10 12:00:00'),
(2,2,'Arjun presented the completed auth flow with JWT refresh tokens. Dr. Meena reviewed code quality and approved PR #12.','JWT access tokens set to 15m expiration with refresh token rotation.',4,'2026-02-25 15:30:00'),
(3,5,'All deliverables accepted by Dr. Meena Raj. Source code tagged v1.0.0 and deployed to production server. Final signoff completed.','Final payment release approved. Certificates to be generated for participating students.',1,'2026-08-01 11:00:00');

-- 35. PROJECT_REPORTS
INSERT INTO project_reports (id,project_id,report_title,report_file,uploaded_by,upload_date) VALUES
(1,1,'HMS Monthly Progress Report - Jan 2026','reports/hms_progress_jan2026.pdf',2,'2026-01-31 17:00:00'),
(2,1,'HMS Architecture and Design Document','reports/hms_architecture_v1.pdf',4,'2026-02-15 16:00:00'),
(3,2,'College ERP Inception Report','reports/erp_inception_report.pdf',2,'2026-02-28 17:30:00'),
(4,5,'Research Portal Final Project Report','reports/research_portal_final_report.pdf',4,'2026-08-01 10:30:00');

-- 36. FINAL_PROJECT_DOCUMENTS
INSERT INTO final_project_documents (id,project_id,final_report,code_handover,closure_notes,uploaded_on) VALUES
(1,5,'docs/final_report_research_portal.pdf','https://github.com/rlabz-org/research-portal/releases/tag/v1.0.0','All deliverables accepted. User manuals delivered. Handed over to department on Aug 1, 2026.','2026-08-01 11:30:00');

-- 37. GITHUB_REPOSITORIES
INSERT INTO github_repositories (id,project_id,repository_name,repository_url,submitted_date,is_verified,verified_by,verified_at,created_at,updated_at) VALUES
(1,1,'medcare-hms','https://github.com/rlabz-org/medcare-hms','2026-01-12',1,4,'2026-01-13 10:00:00',NOW(),NOW()),
(2,2,'mits-college-erp','https://github.com/rlabz-org/mits-college-erp','2026-02-02',1,5,'2026-02-03 11:00:00',NOW(),NOW()),
(3,4,'retail-inventory-app','https://github.com/rlabz-org/retail-inventory-app','2026-03-02',0,NULL,NULL,NOW(),NOW()),
(4,5,'faculty-research-portal','https://github.com/rlabz-org/faculty-research-portal','2025-09-05',1,4,'2025-09-06 09:30:00',NOW(),NOW());

-- 38. FEEDBACK
INSERT INTO feedback (id,project_id,faculty_id,student_id,comments,created_at,updated_at) VALUES
(1,1,4,6,'Exceptional work on the authentication flow and UI layout. Delivered on time with clean code.',NOW(),NOW()),
(2,1,4,7,'Good progress on the patient registration screens. Keep focusing on validation edge cases.',NOW(),NOW()),
(3,2,5,7,'Good start on the student CRUD module. Remember to follow repository pattern for database calls.',NOW(),NOW()),
(4,2,5,8,'Schedule component is clean, need to handle international timezones properly.',NOW(),NOW()),
(5,5,4,6,'Outstanding contribution throughout the research portal lifecycle. Great code quality and documentation.',NOW(),NOW());

-- 39. PERSONAL_ACCESS_TOKENS
INSERT INTO personal_access_tokens (id,tokenable_type,tokenable_id,name,token,abilities,last_used_at,expires_at,created_at,updated_at) VALUES
(1,'App\\Models\\User',1,'director-auth-token','e4d909c290d0fb1ca068ffaddf22cbd0adddef2f98e663a776e0123456789abc','[\"*\"]',NOW(),NULL,NOW(),NOW()),
(2,'App\\Models\\User',6,'student-mobile-token','a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0','[\"*\"]',NOW(),NULL,NOW(),NOW());

SET FOREIGN_KEY_CHECKS = 1;
