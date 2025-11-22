import './Contact.css'
// import './_pageStyles.css'
import React, { useState, ChangeEvent, FormEvent } from "react";

interface FormData {
  name: string;
  email: string;
  message: string;
}

export default function Contact() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    message: "",
  });

  const [status, setStatus] = useState<string>("");
  const apiUrl = process.env.API_GATEWAY_URL;

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.message) {
      setStatus("Please fill out all fields.");
      return;
    }

    console.log("Form submitted:", formData);
    submitContactForm(formData);
    setStatus("Message sent! I'll get back to you soon.");
    setFormData({ name: "", email: "", message: "" });
  };

  async function submitContactForm(data: FormData) {
    const response = await fetch(`${apiUrl}/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to submit form: ${response.statusText}`);
    }

    return await response.json();
  }

  return (
    <div id="contact-main" className="contact-container">
      <h3 className="heading-quaternary">Contact</h3>
      <p className="heading-secondary">
        Feel free to contact me by submitting the form below. I’ll get back to you as soon as possible.
      </p>

      <form className="contact-form" onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="Your Name"
          value={formData.name}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Your Email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <textarea
          name="message"
          placeholder="Your Message"
          value={formData.message}
          onChange={handleChange}
          required
        ></textarea>
        <button type="submit" className="btn btn-primary">Send Message</button>
      </form>

      {status && <p className="form-status">{status}</p>}

      <div className="contact-links">
        <a>mailto:jmstines00@gmail.com</a>
        <a>https://www.linkedin.com/in/jeffreystines/</a>
        <a>https://github.com/jmstines</a>
      </div>
    </div>
  );
}