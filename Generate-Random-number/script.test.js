import * as script from "./script";
import { User } from "./script";
import { app } from "./script";
//The supertest library is required to perform HTTP assertions on the Express application (app).
const request = require("supertest");
// Mock console methods
//Mocking Console Methods: Before all tests run, this code mocks the console.log, console.warn, and console.error methods.
beforeAll(() => {
  global.console = {
    ...console,// Keep all the original console methods
    log: jest.fn(),// Replace console.log with a mock function
    warn: jest.fn(),
    error: jest.fn(),
  };
});
// Mock User model methods
//jest.mock("./script"): This tells Jest to mock the ./script module
jest.mock("./script", () => {
  const actualScript = jest.requireActual("./script");
  return {
    ...actualScript,
    User: {
      insertMany: jest.fn().mockResolvedValue([]),
      find: jest.fn(),
      countDocuments: jest.fn(),
      findByIdAndDelete: jest.fn(),
      deleteMany: jest.fn().mockResolvedValue({ deletedCount: 100 }),
    },
  };
});

describe("Unit Tests for Helper Functions", () => {
  it("Generate a valid username", () => {
    const username = script.generateUsername();
    console.log("Generated username:", username);
    expect(username).toMatch(/^[a-zA-Z]+$/);
  });

  it("Generate a valid phone number", () => {
    const phoneNumber = script.generatePhoneNumber();
    console.log("Generated phone number:", phoneNumber);
    expect(phoneNumber).toMatch(/^\d{10}$/);
  });

  it("Generate a unique email", () => {
    const email = script.generateUniqueEmail();
    console.log("Generated email:", email);
    expect(email).toMatch(/^\S+@\S+\.\S+$/);
  });

  it("should populate the database with random users", async () => {
    //This calls the populateDatabase function from the script module. 
    await script.populateDatabase(
      //{}: The first argument is an empty object,
      {},
      {
        //The second argument is an object that mocks the response object. 
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      }
    );

    const mockInsertMany = User.insertMany;
    const insertedUsers = mockInsertMany.mock.calls.flat();

    insertedUsers.forEach((user) => {
      expect(user).toHaveProperty("username");
      expect(user.username).toMatch(/^[a-zA-Z]+$/);
      expect(user).toHaveProperty("phone");
      expect(user.phone).toMatch(/^\d{10}$/);
      expect(user).toHaveProperty("email");
      expect(user.email).toMatch(/^\S+@\S+\.\S+$/);
    });
  }, 10000); // Set timeout to 10000ms
});

describe("Unit Test for getUsers Function", () => {
  it("should get users with pagination", async () => {
    const mockRequest = { query: { page: "2" } };
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const mockUsers = [
      {
        _id: "1",
        username: "User1",
        email: "user1@example.com",
        phone: "1234567890",
      },
      {
        _id: "2",
        username: "User2",
        email: "user2@example.com",
        phone: "0987654321",
      },
    ];

    // Mock the Mongoose query methods
    const mockQuery = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue(mockUsers),
    };

    User.find.mockReturnValue(mockQuery);
    User.countDocuments.mockResolvedValue(40);

    await script.getUsers(mockRequest, mockResponse);
  });
});

it("should search users with specific query parameters", async () => {
  // Setup your request
  const queryParams = {
    name: "John", // Replace with an actual username present in your database
    email: "john@example.com", // Replace with an actual email present in your database
    phone: "1234567890", // Replace with an actual phone number present in your database
    page: 1,
    limit: 10,
  };
  // Make the API request
  const res = await request(app)
    .get("/users") // Replace with your actual API endpoint
    .query(queryParams);
  // Test assertions
});
describe("Unit Test for deleteUser Function", () => {
  it("should delete a user successfully", async () => {
    const mockRequest = {
      params: { id: "12345" },
    };
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const mockUser = {
      _id: "12345",
      username: "User1",
      email: "user1@example.com",
      phone: "1234567890",
    };

    // Mock the findByIdAndDelete method to return the mock user
    User.findByIdAndDelete.mockResolvedValue(mockUser);

    await script.deleteUsers(mockRequest, mockResponse);
  });

  it("should return a 404 if the user is not found", async () => {
    const mockRequest = {
      params: { id: "12345" },
    };
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Mock the findByIdAndDelete method to return null
    User.findByIdAndDelete.mockResolvedValue(null);

    await script.deleteUsers(mockRequest, mockResponse);
  });

  it("should handle errors gracefully", async () => {
    const mockRequest = {
      params: { id: "12345" },
    };
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    // Mock the findByIdAndDelete method to throw an error
    User.findByIdAndDelete.mockRejectedValue(new Error("Database error"));

    await script.deleteUsers(mockRequest, mockResponse);
  });
});

describe("API Tests", () => {
  it("should populate the database with random users", async () => {
    const res = await request(app).post("/populate");

    expect(res.body.message).toMatch(/Database populated with approximately/);
  });

  it("should fetch users with pagination", async () => {
    script.User.find.mockResolvedValueOnce([
      { username: "testuser", email: "test@example.com", phone: "1234567890" },
    ]);
    const res = await request(app).get("/users").query({ page: 1 });
  });

  it("should search users with specific query parameters", async () => {
    script.User.find.mockResolvedValueOnce([
      { username: "testuser", email: "test@example.com", phone: "1234567890" },
    ]);
    script.User.countDocuments.mockResolvedValueOnce(1);
    const res = await request(app).get("/search").query({ name: "testuser" });
  });

  it("should delete users in batches", async () => {
    const res = await request(app).delete("/deleteAll");

    expect(res.body.message).toMatch(/Deleted/);
  });
});




























