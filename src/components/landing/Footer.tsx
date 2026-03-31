const Footer = () => (
  <footer className="bg-foreground text-background py-8">
    <div className="container text-center">
      <p className="text-lg font-bold mb-2">
        <span className="text-primary">TECH4</span>RENT
      </p>
      <p className="text-sm opacity-70">
        © {new Date().getFullYear()} TECH4RENT. Todos os direitos reservados.
      </p>
    </div>
  </footer>
);

export default Footer;
