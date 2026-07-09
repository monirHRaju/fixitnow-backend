/**
 * Swagger/OpenAPI configuration for FixItNow API.
 */
import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "FixItNow - Home Services Marketplace API",
      version: "1.0.0",
      description:
        "A comprehensive REST API for a home services marketplace. Customers can browse technicians, book services, and make payments via SSLCommerz. Technicians manage their profiles, availability, and bookings. Admins oversee the platform.",
      contact: {
        name: "API Support",
        email: "support@fixitnow.com",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Validation failed" },
            errorDetails: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: { type: "string" },
                  message: { type: "string" },
                  code: { type: "string" },
                },
              },
            },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            email: { type: "string" },
            phone: { type: "string" },
            role: { type: "string", enum: ["CUSTOMER", "TECHNICIAN", "ADMIN"] },
            isBanned: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Booking: {
          type: "object",
          properties: {
            id: { type: "string" },
            customerId: { type: "string" },
            technicianId: { type: "string" },
            serviceId: { type: "string" },
            scheduledAt: { type: "string", format: "date-time" },
            address: { type: "string" },
            notes: { type: "string" },
            status: {
              type: "string",
              enum: [
                "REQUESTED",
                "ACCEPTED",
                "DECLINED",
                "PAID",
                "IN_PROGRESS",
                "COMPLETED",
                "CANCELLED",
              ],
            },
          },
        },
        Payment: {
          type: "object",
          properties: {
            id: { type: "string" },
            bookingId: { type: "string" },
            amount: { type: "integer" },
            method: { type: "string" },
            provider: { type: "string" },
            transactionId: { type: "string" },
            status: { type: "string", enum: ["PENDING", "COMPLETED", "FAILED"] },
            paidAt: { type: "string", format: "date-time" },
          },
        },
        Review: {
          type: "object",
          properties: {
            id: { type: "string" },
            bookingId: { type: "string" },
            rating: { type: "integer", minimum: 1, maximum: 5 },
            comment: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
      },
    },
    paths: {
      "/api/health": {
        get: {
          tags: ["Health"],
          summary: "Health check endpoint",
          responses: {
            "200": {
              description: "Server is running",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      message: { type: "string" },
                      timestamp: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/auth/register": {
        post: {
          tags: ["Authentication"],
          summary: "Register a new user account",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "email", "password"],
                  properties: {
                    name: { type: "string", example: "John Doe" },
                    email: { type: "string", format: "email", example: "john@example.com" },
                    password: { type: "string", minLength: 6, example: "password123" },
                    phone: { type: "string", example: "+8801712345678" },
                    role: {
                      type: "string",
                      enum: ["CUSTOMER", "TECHNICIAN"],
                      default: "CUSTOMER",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Registration successful" },
            "400": { description: "Validation failed", $ref: "#/components/schemas/Error" },
            "409": { description: "Email already exists" },
          },
        },
      },
      "/api/auth/login": {
        post: {
          tags: ["Authentication"],
          summary: "Login with email and password",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email: { type: "string", format: "email" },
                    password: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Login successful, returns JWT token" },
            "401": { description: "Invalid email or password" },
          },
        },
      },
      "/api/auth/me": {
        get: {
          tags: ["Authentication"],
          summary: "Get current authenticated user",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": { description: "Current user profile" },
            "401": { description: "Authentication required" },
          },
        },
      },
      "/api/categories": {
        get: {
          tags: ["Categories"],
          summary: "List all service categories",
          responses: {
            "200": { description: "List of categories" },
          },
        },
        post: {
          tags: ["Categories"],
          summary: "Create a new category (Admin only)",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name"],
                  properties: {
                    name: { type: "string", example: "Plumbing" },
                    description: { type: "string" },
                    iconUrl: { type: "string", format: "uri" },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Category created" },
            "400": { description: "Validation failed" },
            "403": { description: "Admin access required" },
          },
        },
      },
      "/api/services": {
        get: {
          tags: ["Services"],
          summary: "List services with filters",
          parameters: [
            { name: "category", in: "query", schema: { type: "string" } },
            { name: "search", in: "query", schema: { type: "string" } },
            { name: "minPrice", in: "query", schema: { type: "integer" } },
            { name: "maxPrice", in: "query", schema: { type: "integer" } },
            { name: "location", in: "query", schema: { type: "string" } },
            { name: "technician", in: "query", schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "List of services with ratings" },
          },
        },
      },
      "/api/technicians": {
        get: {
          tags: ["Technicians"],
          summary: "List all technicians",
          parameters: [
            { name: "location", in: "query", schema: { type: "string" } },
            { name: "skill", in: "query", schema: { type: "string" } },
            { name: "minRate", in: "query", schema: { type: "integer" } },
            { name: "maxRate", in: "query", schema: { type: "integer" } },
            { name: "available", in: "query", schema: { type: "string", enum: ["true"] } },
          ],
          responses: {
            "200": { description: "List of technicians" },
          },
        },
      },
      "/api/technicians/{id}": {
        get: {
          tags: ["Technicians"],
          summary: "Get full technician profile",
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "Technician profile with services, availability, reviews" },
            "404": { description: "Technician not found" },
          },
        },
      },
      "/api/technician/profile": {
        put: {
          tags: ["Technicians"],
          summary: "Update own technician profile",
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    bio: { type: "string" },
                    skills: { type: "array", items: { type: "string" } },
                    experience: { type: "integer" },
                    hourlyRate: { type: "integer" },
                    location: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Profile updated" },
            "401": { description: "Authentication required" },
          },
        },
      },
      "/api/technician/availability": {
        put: {
          tags: ["Technicians"],
          summary: "Bulk-update availability slots",
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    slots: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          dayOfWeek: { type: "integer", minimum: 0, maximum: 6 },
                          startTime: { type: "string", example: "09:00" },
                          endTime: { type: "string", example: "17:00" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Availability updated" },
          },
        },
      },
      "/api/technician/bookings": {
        get: {
          tags: ["Technicians"],
          summary: "View own bookings (technician)",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "status", in: "query", schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "List of bookings" },
          },
        },
      },
      "/api/technician/bookings/{id}": {
        patch: {
          tags: ["Technicians"],
          summary: "Accept/decline/complete a booking",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: {
                      type: "string",
                      enum: ["ACCEPTED", "DECLINED", "IN_PROGRESS", "COMPLETED"],
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Booking status updated" },
          },
        },
      },
      "/api/bookings": {
        post: {
          tags: ["Bookings"],
          summary: "Create a new booking",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["serviceId", "technicianId", "scheduledAt", "address"],
                  properties: {
                    serviceId: { type: "string" },
                    technicianId: { type: "string" },
                    scheduledAt: { type: "string", format: "date-time" },
                    address: { type: "string" },
                    notes: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Booking created" },
            "400": { description: "Validation failed" },
          },
        },
        get: {
          tags: ["Bookings"],
          summary: "List own bookings (customer)",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "status", in: "query", schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "List of bookings" },
          },
        },
      },
      "/api/bookings/{id}": {
        get: {
          tags: ["Bookings"],
          summary: "Get booking details",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "Booking details" },
            "404": { description: "Booking not found" },
          },
        },
      },
      "/api/bookings/{id}/cancel": {
        patch: {
          tags: ["Bookings"],
          summary: "Cancel a booking",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "Booking cancelled" },
            "400": { description: "Cannot cancel in current status" },
          },
        },
      },
      "/api/payments/create": {
        post: {
          tags: ["Payments"],
          summary: "Initiate SSLCommerz payment for an ACCEPTED booking",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["bookingId"],
                  properties: {
                    bookingId: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Payment session created with gateway URL" },
            "400": { description: "Booking must be ACCEPTED" },
          },
        },
      },
      "/api/payments/confirm": {
        post: {
          tags: ["Payments"],
          summary: "SSLCommerz IPN callback (payment confirmation)",
          responses: {
            "200": { description: "Payment confirmed" },
            "400": { description: "Validation failed" },
          },
        },
      },
      "/api/payments": {
        get: {
          tags: ["Payments"],
          summary: "List own payments",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": { description: "List of payments" },
          },
        },
      },
      "/api/payments/{id}": {
        get: {
          tags: ["Payments"],
          summary: "Get payment details",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "Payment details" },
            "404": { description: "Payment not found" },
          },
        },
      },
      "/api/reviews": {
        post: {
          tags: ["Reviews"],
          summary: "Create a review for a completed booking",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["bookingId", "rating"],
                  properties: {
                    bookingId: { type: "string" },
                    rating: { type: "integer", minimum: 1, maximum: 5 },
                    comment: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Review submitted" },
            "400": { description: "Validation failed or already reviewed" },
          },
        },
        get: {
          tags: ["Reviews"],
          summary: "List own reviews",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": { description: "List of reviews" },
          },
        },
      },
      "/api/reviews/technician/{id}": {
        get: {
          tags: ["Reviews"],
          summary: "List reviews for a technician (public)",
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "Technician reviews with stats" },
            "404": { description: "Technician not found" },
          },
        },
      },
      "/api/admin/dashboard": {
        get: {
          tags: ["Admin"],
          summary: "Platform statistics overview",
          security: [{ bearerAuth: [] }],
          responses: {
            "200": { description: "Dashboard stats" },
            "403": { description: "Admin access required" },
          },
        },
      },
      "/api/admin/users": {
        get: {
          tags: ["Admin"],
          summary: "List all users with pagination",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "page", in: "query", schema: { type: "integer", default: 1 } },
            { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
            { name: "role", in: "query", schema: { type: "string", enum: ["CUSTOMER", "TECHNICIAN", "ADMIN"] } },
          ],
          responses: {
            "200": { description: "Paginated list of users" },
          },
        },
      },
      "/api/admin/users/{id}/ban": {
        patch: {
          tags: ["Admin"],
          summary: "Toggle ban/unban a user",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "User ban status toggled" },
            "403": { description: "Cannot ban an admin" },
            "404": { description: "User not found" },
          },
        },
      },
      "/api/admin/bookings": {
        get: {
          tags: ["Admin"],
          summary: "List all bookings (admin view)",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "page", in: "query", schema: { type: "integer", default: 1 } },
            { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
            { name: "status", in: "query", schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "Paginated list of bookings" },
          },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);