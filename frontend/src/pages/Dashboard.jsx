export default function Dashboard({ title, features }) {
  return (
    <section>
      <h2>{title}</h2>
      <ul>
        {features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>
    </section>
  );
}
