-- Pod 42 AI Employee Onboarding Platform Database Schema
-- PostgreSQL Script for Local Development Setup
--
-- Run this script to create all required tables for the application
-- Usage: psql -d your_database_name -f database-setup.sql

-- Enable UUID generation extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS employee_documents CASCADE;
DROP TABLE IF EXISTS knowledge_queries CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS onboarding_progress CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'hr',
    created_at TIMESTAMP DEFAULT now()
);

-- Create employees table
CREATE TABLE employees (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    department TEXT NOT NULL,
    position TEXT NOT NULL,
    start_date TIMESTAMP NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    onboarding_stage TEXT NOT NULL DEFAULT 'Pre-boarding',
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT now()
);

-- Create onboarding_progress table
CREATE TABLE onboarding_progress (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id VARCHAR NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    stage TEXT NOT NULL,
    completion_percentage INTEGER NOT NULL DEFAULT 0,
    tasks JSONB NOT NULL DEFAULT '[]',
    last_updated TIMESTAMP DEFAULT now()
);

-- Create documents table (knowledge base)
CREATE TABLE documents (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    file_type TEXT NOT NULL,
    category TEXT NOT NULL,
    tags JSONB NOT NULL DEFAULT '[]',
    uploaded_by VARCHAR REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Create chat_messages table
CREATE TABLE chat_messages (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id VARCHAR REFERENCES employees(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    response TEXT,
    is_from_ai BOOLEAN NOT NULL DEFAULT false,
    timestamp TIMESTAMP DEFAULT now()
);

-- Create knowledge_queries table
CREATE TABLE knowledge_queries (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    query TEXT NOT NULL,
    results JSONB NOT NULL DEFAULT '[]',
    employee_id VARCHAR REFERENCES employees(id) ON DELETE CASCADE,
    timestamp TIMESTAMP DEFAULT now()
);

-- Create employee_documents table
CREATE TABLE employee_documents (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id VARCHAR NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    file_data TEXT NOT NULL, -- Base64 encoded file data
    uploaded_at TIMESTAMP DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_employees_department ON employees(department);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_onboarding_progress_employee ON onboarding_progress(employee_id);
CREATE INDEX idx_documents_category ON documents(category);
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX idx_chat_messages_employee ON chat_messages(employee_id);
CREATE INDEX idx_chat_messages_timestamp ON chat_messages(timestamp);
CREATE INDEX idx_knowledge_queries_employee ON knowledge_queries(employee_id);
CREATE INDEX idx_employee_documents_employee ON employee_documents(employee_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at for documents table
CREATE TRIGGER update_documents_updated_at 
    BEFORE UPDATE ON documents 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data (optional - remove if you don't want sample data)
INSERT INTO users (username, password, role) VALUES 
    ('admin', '$2b$10$hash_here', 'hr'),
    ('hr_manager', '$2b$10$hash_here', 'hr');

INSERT INTO employees (name, email, department, position, start_date, status, onboarding_stage) VALUES 
    ('John Smith', 'john.smith@pod42ai.com', 'Engineering', 'Senior Software Engineer', '2025-01-15', 'active', 'Pre-boarding'),
    ('Sarah Johnson', 'sarah.johnson@pod42ai.com', 'Product', 'Product Manager', '2025-01-20', 'active', 'Pre-boarding'),
    ('Mike Wilson', 'mike.wilson@pod42ai.com', 'Engineering', 'Frontend Developer', '2025-01-10', 'active', 'Pre-boarding');

INSERT INTO documents (title, content, file_type, category, tags) VALUES 
    ('Employee Handbook 2025', 'Complete employee handbook with policies, procedures, and company information...', 'PDF', 'policies', '["handbook", "policies", "hr"]'),
    ('Security Training Guide', 'Security protocols including 2FA, VPN usage, password management, and certification requirements...', 'PDF', 'training', '["security", "training", "2fa", "vpn"]'),
    ('Remote Work Policy', 'Guidelines for remote work, communication standards, and productivity expectations...', 'PDF', 'policies', '["remote", "policy", "work"]');

-- Grant permissions (adjust user as needed)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_db_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_db_user;

-- Display table creation summary
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('users', 'employees', 'onboarding_progress', 'documents', 'chat_messages', 'knowledge_queries', 'employee_documents')
ORDER BY tablename;

-- Display row counts
SELECT 
    'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 
    'employees', COUNT(*) FROM employees  
UNION ALL
SELECT 
    'documents', COUNT(*) FROM documents
UNION ALL
SELECT 
    'onboarding_progress', COUNT(*) FROM onboarding_progress
UNION ALL
SELECT 
    'chat_messages', COUNT(*) FROM chat_messages
UNION ALL
SELECT 
    'knowledge_queries', COUNT(*) FROM knowledge_queries
UNION ALL
SELECT 
    'employee_documents', COUNT(*) FROM employee_documents;

COMMIT;