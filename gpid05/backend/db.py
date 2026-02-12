#This file is for establishing connectivity with the MySQL Database

import mysql.connector
import boto3

def dbConnect(password):   
    conn = None
    try:
        conn = mysql.connector.connect(
        host='cpsc4910-s26.cobd8enwsupz.us-east-1.rds.amazonaws.com',
        port=3306,
        database='Team05_DB',
        user='Team05',
        password=password,
        ssl_disabled=False,
        ssl_ca='/certs/global-bundle.pem'
    )
        cur = conn.cursor()
        cur.execute('SELECT VERSION();')
        print(cur.fetchone()[0])
        cur.close()
    except Exception as e:
        print(f"Database error: {e}")

#confirm connection established
    if conn:
     print("Connection established successfully")

    return conn

#connection testing
conn = dbConnect()

if conn:
    cursor = conn.cursor()
    
    query = "SELECT * FROM Version_Info"
    cursor.execute(query)

    # Fetch results
    results = cursor.fetchall()
    for row in results:
        print(row)

    query = "UPDATE Version_Info SET ProductDesc = 'Test' WHERE TeamNum = 5"
    cursor.execute(query)
    conn.commit()

#close connection
def dbConnClose(conn):
    conn.close()
    print("Connection closed")

dbConnClose(conn)
