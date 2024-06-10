# Upscale ncnn API
## Project Description
This Project takes Form-Data as input and return request-id, the image is upscaled via upscaly ncnn and then progress percentage gets updated to supabase via realtime API, it also extract the png metadata from the input image. It also checks if the API check is valid and has enough quota to initiate the process.
# Installation
## Setting up the Supabase
### 1. Database Setup
![image](https://github.com/Mohking1/Upscale-ncnn-API/assets/63689545/d8a2b86d-fb26-489a-a2bf-0d450abf144b)
The Databse should be configured like this.
### 2. Then add two function.
1st Function :- Name :- ```check_api_key_and_quota```
                Argument :- api_key_param TEXT
#### Code:-
```
DECLARE
    daily_quota_remaining INTEGER;
    monthly_quota_remaining INTEGER;
    yearly_quota_remaining INTEGER;
    exp BOOLEAN;
    result check_api_key_and_quota_result;
BEGIN
    -- Get the remaining daily, monthly, and yearly quotas for the provided API key
    SELECT daily_quota, monthly_quota, yearly_quota, expired 
    INTO daily_quota_remaining, monthly_quota_remaining, yearly_quota_remaining, exp
    FROM api_table
    WHERE api = api_key_param;

    -- If the API key doesn't exist, has no remaining daily, monthly, or yearly quota, or is expired, return false
    IF daily_quota_remaining IS NULL OR daily_quota_remaining <= 0 
       OR monthly_quota_remaining IS NULL OR monthly_quota_remaining <= 0 
       OR yearly_quota_remaining IS NULL OR yearly_quota_remaining <= 0 
       OR exp THEN
        result.success := FALSE;
        result.message := 'Invalid API key or quota exceeded';
    ELSE
        result.success := TRUE;
        result.message := '';
    END IF;

    RETURN result;
END;
```
2nd Function :- Name :- ```update_api_quotas```
                Argument :- api_key_param TEXT
#### Code:-
```
BEGIN
    UPDATE api_table
    SET daily_quota = daily_quota - 1,
        monthly_quota = monthly_quota - 1,
        yearly_quota = yearly_quota - 1,
        quota_used = quota_used + 1
    WHERE api = api_key_param;
END;
```
## Setting Up Upscaly ncnn
You can vist https://github.com/upscayl/upscayl-ncnn and follow instruction to install it.
## Installation
### 1. Clone
Git clone the repo ```git clone https://github.com/Mohking1/Upscale-ncnn-API.git```
### 2. Create .env File
Create a .env file then paste below code.
```
supabaseUrl = '<Your_supabase_url>';
supabaseKey = '<Your_supabse_key>';
upscayl-bin_location = "<location_of_upscayl_bin>"
upscayl-input_location = "<location_of_input_for_upscayl>"
upscayl-output_location = "<location_of_output_for_upscayl>"
upscayl-model_location = "<location_of_models_for_upscayl>"
```
### 3. Initialize the project
```bash
npm init
```
### 4. Install dependencies
```bash
npm install
```
### 5. Start the Server
```bash
npm start
```
## Routes
##### The POST request should be in done on ```http://127.0.0.1:3000/upload```. It mut include image or image_url, scale, and model_name which is by default ```realesrgan-x4plus``` and api which shows the user api and is checked against api_table in databse for verification.
##### The GET request should be on ```http://127.0.0.1:3000/upscaled/request-id``` the request id which is returned after POST request.
## Additional Info
##### Bit-depth - Bit depth refers to the color information stored in an image. The higher the bit depth of an image, the more colors it can store. Sometimes depending on software which created the png might omit this detail hence it not available would be stored as 0.
##### DPI - DPI stands for Dots per Inch, referring to the number of ink droplets a printer will produce per inch while printing an image. The more dots of ink per inch the picture has, the more detail you will see when printed. Sometimes depending on software which created the png might omit this detail hence it not available would be stored as 0.
