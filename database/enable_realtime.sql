-- Run this in your Supabase SQL Editor to enable Realtime for emergency alerts and data access requests

-- Enable Realtime for emergencies (so driver dashboard receives alerts instantly)
ALTER PUBLICATION supabase_realtime ADD TABLE public.emergencies;

-- Enable Realtime for data access requests (so hospital lookup sees relative approval/denial instantly)
ALTER PUBLICATION supabase_realtime ADD TABLE public.data_access_requests;
