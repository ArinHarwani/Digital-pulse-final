-- Archive all active emergencies for MGH so the dashboard starts clean
UPDATE public.emergency_requests
SET status = 'admitted'
WHERE assigned_hospital_id = 'hosp-001' AND status = 'hospital_assigned';
