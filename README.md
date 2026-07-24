# BeautyNear

> A scalable full-stack SaaS platform for discovering, booking, and managing K-Beauty salons across South Korea.

## Overview
BeautyNear is a modern multi-role salon booking platform built with Next.js, NestJS, GraphQL, MongoDB, and Socket.IO. The platform enables customers to discover salons, book appointments, communicate with salon owners in real time, and provides comprehensive management tools for salon owners and administrators through a secure, scalable architecture.

## Key Features
### Member
- Search salons
- View salon details
- Browse services
- Create bookings
- Manage profile
- Follow salons
- Like content
- Write reviews and comments
- Receive notifications
- Real-time chat

### Salon Owner
- Create/update salons
- Create/update services
- Manage bookings
- Accept/cancel bookings
- Manage working hours
- Manage gallery
- View customer reviews
- Real-time chat

### Admin
- Members management
- Salon owners management
- Salon approval
- Services management
- Booking monitoring
- Review moderation
- Payment monitoring structure
- Dashboard analytics
- Banner/Event management
- Community posts management
- Notifications management

## Tech Stack
**Frontend:** Next.js, React, TypeScript, Apollo Client, GraphQL, Tailwind CSS, Material UI, Redux Toolkit, React Hook Form, Swiper

**Backend:** NestJS, GraphQL, Apollo Server, REST API, MongoDB, Mongoose, JWT Authentication, bcrypt, Multer, Socket.IO

## Authentication
- MemberNick + Phone Number
- JWT Access Token

## API Architecture
- GraphQL for business logic
- REST API (Axios + Multer) for file uploads

## Database
members, salons, services, bookings, messages, notifications, likes, follows, views, comments, boardArticles, boardarticles, notices, faqs, inquiries

## Architecture Patterns
- MVC
- Dependency Injection
- Middleware
- Guards
- Decorators

## Deployment
- Frontend: Vercel
- Backend: DigitalOcean VPS (PM2, Nginx, SSL)

## Development Workflow
- Git
- GitHub
- main / develop / feature branches
- Pull Requests

## Project Highlights
- Multi-role SaaS architecture
- Hybrid GraphQL + REST API
- JWT Authentication
- Socket.IO real-time communication
- MongoDB with Mongoose
- Vercel & DigitalOcean deployment
- Modular NestJS architecture
- Git-based collaborative workflow
