# Pod 42 AI - Employee Onboarding Platform

## Overview

This is a full-stack web application designed to streamline and automate employee onboarding processes using AI assistance. The platform provides HR professionals with tools to manage new employee workflows, maintain a searchable knowledge base, and offer AI-powered chat assistance throughout the onboarding journey.

The application features a modern dashboard for tracking onboarding progress, automated workflow management, document upload and search capabilities, and real-time chat assistance for new employees.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database interactions
- **API Design**: RESTful API with JSON responses
- **Session Management**: Express sessions with PostgreSQL store
- **Error Handling**: Centralized error middleware with structured responses

### Data Storage
- **Primary Database**: PostgreSQL with Neon serverless hosting
- **Schema Management**: Drizzle migrations with schema-first approach
- **Data Models**: 
  - Users (HR staff authentication)
  - Employees (onboarding candidates)
  - OnboardingProgress (stage tracking with task completion)
  - Documents (knowledge base with categorization)
  - ChatMessages (AI assistant conversations)
  - KnowledgeQueries (search and retrieval tracking)

### Key Design Patterns
- **Monorepo Structure**: Shared schema and types between client/server
- **Type Safety**: End-to-end TypeScript with Zod runtime validation
- **Component Architecture**: Reusable UI components with consistent design tokens
- **Server-Side Rendering**: Development-only Vite SSR for improved DX
- **Progressive Enhancement**: Mobile-responsive design with accessibility features

### Authentication & Authorization
- **Session-Based Auth**: Server-side sessions with secure cookies
- **Role-Based Access**: HR role system for administrative functions
- **Data Isolation**: Employee-specific data access patterns

## External Dependencies

### Database & Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **WebSocket Support**: Real-time features via ws library for database connections

### UI & Styling Libraries
- **Radix UI**: Headless component primitives for accessibility
- **Tailwind CSS**: Utility-first styling with PostCSS processing
- **Lucide React**: Consistent icon library
- **Class Variance Authority**: Type-safe component variants

### Development & Build Tools
- **Vite**: Fast development server with HMR and optimized builds
- **ESBuild**: Fast TypeScript compilation and bundling
- **Replit Integration**: Development environment plugins and error overlays

### Form & Data Libraries
- **React Hook Form**: Performance-optimized form management
- **Zod**: Runtime type validation and schema definition
- **TanStack Query**: Server state management with caching
- **Date-fns**: Date manipulation and formatting utilities

### Additional Features
- **Embla Carousel**: Touch-friendly carousel components for mobile
- **CMDK**: Command palette interface for quick navigation
- **React Day Picker**: Accessible date selection components