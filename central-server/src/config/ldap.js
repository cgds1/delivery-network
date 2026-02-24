const ldap = require('ldapjs');

const LDAP_URL = process.env.LDAP_URL || 'ldap://openldap:389';
const LDAP_BASE_DN = process.env.LDAP_BASE_DN || 'dc=reddedeliveries,dc=local';
const LDAP_BIND_DN = process.env.LDAP_BIND_DN || 'cn=admin,dc=reddedeliveries,dc=local';
const LDAP_BIND_PASSWORD = process.env.LDAP_BIND_PASSWORD || 'admin_secret';

/**
 * Authenticate a user against LDAP and return their group (role).
 * Returns { uid, cn, role } on success, throws on failure.
 */
async function authenticateUser(uid, password) {
  return new Promise((resolve, reject) => {
    const userDN = `uid=${uid},ou=People,${LDAP_BASE_DN}`;

    // First: bind as the user to verify password
    const client = ldap.createClient({ url: LDAP_URL });
    client.bind(userDN, password, (err) => {
      if (err) {
        client.destroy();
        return reject(new Error('Invalid credentials'));
      }

      // Second: search for user's group membership
      const adminClient = ldap.createClient({ url: LDAP_URL });
      adminClient.bind(LDAP_BIND_DN, LDAP_BIND_PASSWORD, (adminErr) => {
        if (adminErr) {
          client.destroy();
          adminClient.destroy();
          return reject(new Error('LDAP admin bind failed'));
        }

        const opts = {
          filter: `(member=uid=${uid},ou=People,${LDAP_BASE_DN})`,
          scope: 'sub',
          attributes: ['cn'],
        };

        adminClient.search(`ou=Groups,${LDAP_BASE_DN}`, opts, (searchErr, res) => {
          let role = null;
          let cn = uid;

          res.on('searchEntry', (entry) => {
            role = entry.pojo.attributes.find(a => a.type === 'cn')?.values[0] || entry.pojo.objectName;
          });

          res.on('end', () => {
            client.destroy();
            adminClient.destroy();
            if (!role) return reject(new Error('User has no group assigned'));
            resolve({ uid, cn, role });
          });

          res.on('error', (e) => {
            client.destroy();
            adminClient.destroy();
            reject(e);
          });
        });
      });
    });
  });
}

module.exports = { authenticateUser };
