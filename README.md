# continuous-development-and-deployment

This repository contains my solutions to the TUNI course **COMP.SE.140: Continuous Development and Deployment - DevOps**.  
It includes exercises and project that demonstrate practical DevOps skills, such as containerization, CI/CD, and microservices.

---

## Exercises

Each exercise is developed on a **separate branch**.
For example:

- `exercise1` – Docker Compose and microservices hands-on
- `exercise2` – GitLab CI/CD Pipeline hands-on
- `exercise3` – Deployment

To view or test a specific exercise, you can clone the repository and switch to the desired branch:

```bash
git clone <repository-url>
git checkout exercise1
```

---

## Project

The project brings together all the exercises into a complete pipeline and deployment setup.
It includes blue-green deployment for different application versions, along with an API gateway and a monitoring console to inspect the application state.

The project application versions are available in the branches `project1.0` and `project1.1` and can be cloned in the same manner as described in the exercises above.
