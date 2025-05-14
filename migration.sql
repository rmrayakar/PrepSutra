-- Create exam_questions table
CREATE TABLE IF NOT EXISTS public.exam_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_text TEXT NOT NULL,
    year INTEGER NOT NULL,
    subject TEXT NOT NULL,
    exam_type TEXT NOT NULL,
    keywords TEXT[] NOT NULL DEFAULT '{}',
    options TEXT[] DEFAULT NULL,
    correct_answer TEXT DEFAULT NULL,
    explanation TEXT DEFAULT NULL,
    question_type TEXT DEFAULT 'mcq',
    marks INTEGER NOT NULL DEFAULT 1,
    user_id UUID REFERENCES auth.users(id),
    is_database_question BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add a comment to the table
COMMENT ON TABLE public.exam_questions IS 'Stores previous year exam questions with metadata';

-- Create an index on frequently searched columns
CREATE INDEX IF NOT EXISTS exam_questions_year_idx ON public.exam_questions (year);
CREATE INDEX IF NOT EXISTS exam_questions_subject_idx ON public.exam_questions (subject);
CREATE INDEX IF NOT EXISTS exam_questions_exam_type_idx ON public.exam_questions (exam_type);
CREATE INDEX IF NOT EXISTS exam_questions_keywords_idx ON public.exam_questions USING GIN (keywords);
CREATE INDEX IF NOT EXISTS exam_questions_question_type_idx ON public.exam_questions (question_type);
CREATE INDEX IF NOT EXISTS exam_questions_user_id_idx ON public.exam_questions (user_id);
CREATE INDEX IF NOT EXISTS exam_questions_is_database_idx ON public.exam_questions (is_database_question);

-- Set up Row Level Security (RLS)
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;

-- Create policy for users to select database questions or their own questions
CREATE POLICY "Users can read database questions and their own questions" 
ON public.exam_questions FOR SELECT 
USING (is_database_question = true OR auth.uid() = user_id);

-- Allow authenticated users to insert questions
CREATE POLICY "Enable insert for authenticated users only" 
ON public.exam_questions FOR INSERT 
TO authenticated USING (auth.uid() = user_id);

-- Allow users to update their own questions
CREATE POLICY "Users can update their own questions" 
ON public.exam_questions FOR UPDATE 
TO authenticated USING (auth.uid() = user_id);

-- Allow users to delete their own questions
CREATE POLICY "Users can delete their own questions" 
ON public.exam_questions FOR DELETE 
TO authenticated USING (auth.uid() = user_id);

-- Create question_answers table to store user answers
CREATE TABLE IF NOT EXISTS public.question_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES public.exam_questions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    answer_text TEXT NOT NULL,
    similarity_score FLOAT,
    awarded_marks FLOAT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(question_id, user_id)
);

-- Add RLS policies for question_answers
ALTER TABLE public.question_answers ENABLE ROW LEVEL SECURITY;

-- Users can only see their own answers
CREATE POLICY "Users can read their own answers" 
ON public.question_answers FOR SELECT 
USING (auth.uid() = user_id);

-- Users can only insert their own answers
CREATE POLICY "Users can insert their own answers" 
ON public.question_answers FOR INSERT 
TO authenticated USING (auth.uid() = user_id);

-- Users can only update their own answers
CREATE POLICY "Users can update their own answers" 
ON public.question_answers FOR UPDATE 
TO authenticated USING (auth.uid() = user_id);

-- Users can only delete their own answers
CREATE POLICY "Users can delete their own answers" 
ON public.question_answers FOR DELETE 
TO authenticated USING (auth.uid() = user_id);

-- Function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function whenever a row is updated in exam_questions
CREATE TRIGGER update_exam_questions_timestamp
BEFORE UPDATE ON public.exam_questions
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Trigger to call the function whenever a row is updated in question_answers
CREATE TRIGGER update_question_answers_timestamp
BEFORE UPDATE ON public.question_answers
FOR EACH ROW
EXECUTE FUNCTION update_modified_column(); 