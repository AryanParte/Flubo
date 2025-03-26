
-- Create a function to increment comment count safely
CREATE OR REPLACE FUNCTION increment_comment_count(post_id UUID, increment_by INT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.posts
  SET comments_count = GREATEST(0, comments_count + increment_by)
  WHERE id = post_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.increment_comment_count TO authenticated;
