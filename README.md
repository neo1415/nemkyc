# NEM Customer Data Collection Application Documentation

The NEM Customer Data Collection Application is critical in customer data management. It is designed to collect and securely store customer data, offering a reliable and efficient solution for businesses seeking to enhance their data collection processes. The core objectives of the application are as follows

## Data Collection:
At its core, the application is built to streamline and optimize the collection of customer data. It provides an intuitive and user-friendly platform for gathering vital customer information. 
## Data Security:
The application prioritizes the security of customer data. All collected information is stored in a secure database, ensuring the confidentiality and privacy of sensitive customer details. 
## Administrative Control:
To facilitate effective data management, the application empowers administrators with the tools they need to access, oversee, and manipulate collected user data.

## Use Cases:
1. Small and Large Businesses: businesses can utilize this application to collect and organize customer information efficiently, improving customer relationship management.
2. Customer Support Teams: Customer support teams can benefit from the streamlined data collection process and easy access to customer data for issue resolution.

## Technology Stack
The application relies on the following technologies to deliver its functionality:
1. React: React, a popular JavaScript library for building user interfaces, forms the foundation of the application's front end.
2. Firebase Firestore: Firebase Firestore serves as the database solution, ensuring data integrity and accessibility.
3. Node JS: This is a back-end JavaScript runtime for handling how the client side interacts with the server side
4. Express JS: Express.js is a web application framework for Node.js that simplifies the process of building web applications and APIs. It provides a set of methods for routing HTTP requests, configuring middleware, rendering HTML views, and modifying
application settings.

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### Dashboard
The admin dashboard in the NEM Customer Data Collection Application is a powerful tool designed to provide administrators with comprehensive control over collected data. Below, you'll find an in-depth explanation of how to access the dashboard, its extensive features, and the access control mechanisms in place:
## Accessing the Admin Dashboard:
1. Access Permissions:
To access the admin dashboard, users must have multi-level access, which is typically granted through user roles and permissions by the administrator configured during the user registration.

2. Authentication:
Users are required to authenticate themselves by signing in with their credentials before gaining access to the dashboard. Firebase Authentication ensures secure user verification.

3. Automatic Logout on Inactivity:
To enhance security, the admin dashboard includes an automatic logout feature. If a user remains inactive for a specified period (in this case., 10 minutes), the application will automatically log them out to prevent unauthorized access. This feature
safeguards sensitive data when a user forgets to log out manually

4. Robust Data Filtering and Sorting Options:
Moderators can filter entries based on specific date ranges or on any column title on the table example being company name or address. This feature enables targeted data analysis and reporting by narrowing down entries to a particular time frame or metric.

5. Collection Views:
The dashboard offers separate views for Form submissions. Users can effortlessly switch between these views to focus on a specific form type.

6. PDF Download:
In the detailed entry view, moderators can download the entire user submission as a PDF.

7. User Management:
Administrators have the added menu option and interface to manage users(moderators)
by creating user accounts, assigning them roles according to their permissions as well as
deleting said users when they no longer require access to the dashboard
